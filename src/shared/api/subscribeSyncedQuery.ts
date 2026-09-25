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
  let stop: () => void = () => undefined;
  let base: SyncCheckpoint | null = null;
  let baseValues = new Map<string, T>();
  let receivedSnapshot = false;
  const fail = (cause: unknown) => {
    if (active) options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  const publish = (result: SyncedQueryResult<T>) => {
    if (!active) return;
    receivedSnapshot = true;
    try {
      options.receive(result);
    } catch (error) {
      fail(error);
    }
  };

  async function restoreSaved() {
    const saved = await loadSyncCheckpoint(options.scope);
    if (!active || !saved) return;
    try {
      const values = new Map<string, T>();
      for (const [id, data] of Object.entries(saved.documents)) {
        readSyncTimestamp(data);
        values.set(id, options.parse(id, data));
      }
      base = saved;
      baseValues = values;
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
    if (base && !receivedSnapshot)
      publish({ values: [...baseValues.values()], fromCache: true, hasPendingWrites: false });
    fail(error);
  }

  function ingest(snapshot: QuerySnapshot, changes: Map<string, SyncChange<T>>, invalid: Map<string, unknown>) {
    readSyncChanges(snapshot, changes, invalid, options.parse);
    if (invalid.size > 0) {
      restoreOnError(invalid.values().next().value);
      return;
    }
    const merged = mergeSyncChanges(base ?? { documents: {}, lastUpdatedAt: null }, baseValues, changes);
    const confirmed = !(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites);
    if (confirmed) {
      confirm(merged);
      changes.clear();
    }
    publish({
      values: [...merged.values.values()],
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
    });
  }

  async function start() {
    await restoreSaved();
    if (!active) return;
    const changes = new Map<string, SyncChange<T>>();
    const invalid = new Map<string, unknown>();
    stop = onSnapshot(
      options.request(base?.lastUpdatedAt ?? null),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (active) ingest(snapshot, changes, invalid);
      },
      (error) => {
        if (active) restoreOnError(error);
      }
    );
  }
  void start().catch(fail);
  return () => {
    active = false;
    stop();
  };
}
