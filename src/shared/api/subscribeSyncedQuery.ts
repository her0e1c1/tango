import { onSnapshot, type DocumentData, type Query, type QuerySnapshot } from "firebase/firestore";
import {
  loadSyncCheckpoint,
  saveSyncCheckpoint,
  deleteSyncCheckpoint,
  type SyncCheckpoint,
  type SyncTimestamp,
} from "./syncPersistence";
import {
  readSyncTimestamp,
  readSyncChanges,
  mergeSyncChanges,
  type SyncChange,
  type SyncedQueryResult,
} from "./syncSnapshot";

interface SyncedQueryOptions<T> {
  scope: string;
  request: (cursor: SyncTimestamp | null) => Query;
  parse: (id: string, data: DocumentData) => T;
  receive: (result: SyncedQueryResult<T>) => void;
  onError: (error: Error) => void;
}
/** Mirrors snapshot changes; writes and retries remain entirely in the Firestore SDK. */
export function subscribeSyncedQuery<T>(options: SyncedQueryOptions<T>): () => void {
  let active = true;
  const isActive = () => active;
  let stop: () => void = () => undefined;
  let base: SyncCheckpoint = { documents: {}, lastUpdatedAt: null };
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
      options.receive(result);
    } catch (error) {
      fail(error);
    }
  };

  async function restoreSaved() {
    const saved = await loadSyncCheckpoint(options.scope);
    if (!isActive() || !saved) return;
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
      await deleteSyncCheckpoint(options.scope).catch(fail);
    }
  }

  function confirm(merged: ReturnType<typeof mergeSyncChanges<T>>) {
    base = {
      documents: merged.documents,
      lastUpdatedAt: merged.lastUpdatedAt,
    };
    baseValues = merged.values;
    void saveSyncCheckpoint(options.scope, base).catch(fail);
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
    if (confirmed) confirm(merged);
    publish({
      values: [...merged.values.values()],
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
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
    await restoreSaved();
    if (isActive()) listen(base.lastUpdatedAt);
  }
  void start().catch(fail);
  return () => {
    active = false;
    stop();
  };
}
