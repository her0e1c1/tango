import { onSnapshot, type DocumentData, type Query, type QuerySnapshot } from "firebase/firestore";
import { hydrateSyncStore, type SyncCheckpoint, type SyncState, type SyncTimestamp } from "./syncPersistence";
import {
  readSyncTimestamp,
  readSyncChanges,
  mergeSyncChanges,
  type SyncChange,
  type SyncedQueryResult,
} from "./syncSnapshot";

interface SyncStore {
  getState: () => SyncState;
  persist: { hasHydrated: () => boolean; rehydrate: () => void | Promise<void> };
}

interface SyncedQueryOptions<T> {
  scope: string;
  store: SyncStore;
  request: (cursor: SyncTimestamp | null) => Query;
  parse: (id: string, data: DocumentData) => T;
  receive: (result: SyncedQueryResult<T>) => unknown;
  onError: (error: Error) => void;
}
/** Mirrors snapshot changes; writes and retries remain entirely in the Firestore SDK. */
export function subscribeSyncedQuery<T>(options: SyncedQueryOptions<T>): () => void {
  let active = true;
  const isActive = () => active;
  let stop: () => void = () => undefined;
  let base: SyncCheckpoint = { documents: {}, lastUpdatedAt: null, documentCount: 0 };
  let baseValues = new Map<string, T>();
  let restored = false;
  let published = false;
  const fail = (cause: unknown) => {
    if (active) options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  const publish = (result: SyncedQueryResult<T>) => {
    if (!isActive()) return;
    published = true;
    try {
      void Promise.resolve(options.receive(result)).catch(fail);
    } catch (error) {
      fail(error);
    }
  };

  function restoreSaved() {
    const saved = options.store.getState().sync[options.scope];
    if (!saved) return;
    try {
      const values = new Map<string, T>();
      for (const [id, data] of Object.entries(saved.documents)) {
        readSyncTimestamp(data);
        values.set(id, options.parse(id, data));
      }
      base = saved;
      baseValues = values;
      restored = true;
    } catch {
      publish({ values: [], fromCache: true, hasPendingWrites: false, checkpoint: null });
    }
  }

  function confirm(merged: ReturnType<typeof mergeSyncChanges<T>>) {
    base = {
      documents: merged.documents,
      lastUpdatedAt: merged.lastUpdatedAt,
      documentCount: Object.keys(merged.documents).length,
    };
    baseValues = merged.values;
    return base;
  }

  function restoreOnError(error: unknown) {
    if (restored && !published) publish({ values: [...baseValues.values()], fromCache: true, hasPendingWrites: false });
    fail(error);
  }

  function ingest(snapshot: QuerySnapshot, changes: Map<string, SyncChange<T>>, invalid: Map<string, unknown>) {
    readSyncChanges(snapshot, changes, invalid, options.parse);
    if (invalid.size > 0) {
      restoreOnError(invalid.values().next().value);
      return;
    }
    const merged = mergeSyncChanges(base, baseValues, changes);
    const confirmed = !(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites);
    const checkpoint = confirmed ? confirm(merged) : undefined;
    publish({
      values: [...merged.values.values()],
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
      ...(checkpoint ? { checkpoint } : {}),
    });
    return confirmed;
  }

  function listen(cursor: SyncTimestamp | null) {
    stop();
    let current = true;
    const isCurrent = () => isActive() && current;
    const changes = new Map<string, SyncChange<T>>();
    const invalid = new Map<string, unknown>();
    const unsubscribe = onSnapshot(
      options.request(cursor),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!isCurrent()) return;
        const confirmed = ingest(snapshot, changes, invalid);
        // Only the full initial read transitions to a tail. The SDK owns reconnects.
        if (isCurrent() && confirmed && cursor === null && base.lastUpdatedAt !== null) listen(base.lastUpdatedAt);
      },
      (error) => {
        if (isCurrent()) restoreOnError(error);
      }
    );
    stop = () => {
      current = false;
      unsubscribe();
    };
  }

  async function start() {
    await hydrateSyncStore(options.store);
    if (!isActive()) return;
    restoreSaved();
    if (isActive()) listen(base.lastUpdatedAt);
  }
  void start().catch(fail);
  return () => {
    active = false;
    stop();
  };
}
