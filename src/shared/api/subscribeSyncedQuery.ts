import { onSnapshot, type DocumentData, type Query } from "firebase/firestore";
import { saveSyncCheckpoint, type SyncTimestamp } from "./syncPersistence";
import {
  loadSyncReplica,
  type SyncReplica,
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
  let unsubscribe: (() => void) | undefined;
  let base: SyncReplica<T> | null = null;
  let receivedSnapshot = false;
  const fail = (cause: unknown) => {
    if (active) options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  function restoreOnError(error: unknown) {
    if (base && !receivedSnapshot) {
      receivedSnapshot = true;
      options.receive({ values: [...base.values.values()], fromCache: true, hasPendingWrites: false });
    }
    fail(error);
  }

  async function start() {
    const saved = await loadSyncReplica(options.scope, options.parse);
    if (!active) return;
    base = saved;
    const changes = new Map<string, SyncChange<T>>();
    unsubscribe = onSnapshot(
      options.request(base?.checkpoint.lastUpdatedAt ?? null),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return;
        readSyncChanges(snapshot, changes, options.parse);
        let merged: SyncReplica<T>;
        try {
          merged = mergeSyncChanges(base, changes);
        } catch (error) {
          restoreOnError(error);
          return;
        }
        if (!(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)) {
          base = merged;
          void saveSyncCheckpoint(options.scope, base.checkpoint).catch(fail);
          changes.clear();
        }
        receivedSnapshot = true;
        options.receive({
          values: [...merged.values.values()],
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        });
      },
      (error) => {
        if (active) restoreOnError(error);
      }
    );
  }
  void start().catch(fail);
  return () => {
    active = false;
    unsubscribe?.();
  };
}
