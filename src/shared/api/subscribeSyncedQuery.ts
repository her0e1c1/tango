import { onSnapshot, type DocumentData, type Query } from "firebase/firestore";
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
  let unsubscribe: (() => void) | undefined;
  let base: { checkpoint: SyncCheckpoint; values: Map<string, T> } | null = null;
  let receivedSnapshot = false;
  const fail = (cause: unknown) => {
    if (active) options.onError(cause instanceof Error ? cause : new Error(String(cause)));
  };
  async function restoreSaved() {
    const saved = await loadSyncCheckpoint(options.scope);
    if (!active || !saved) return null;
    try {
      const values = new Map<string, T>();
      for (const [id, data] of Object.entries(saved.documents)) {
        readSyncTimestamp(data);
        values.set(id, options.parse(id, data));
      }
      return { checkpoint: saved, values };
    } catch {
      await deleteSyncCheckpoint(options.scope).catch(fail);
      return null;
    }
  }

  function restoreOnError(error: unknown) {
    if (base && !receivedSnapshot) {
      receivedSnapshot = true;
      options.receive({ values: [...base.values.values()], fromCache: true, hasPendingWrites: false });
    }
    fail(error);
  }

  async function start() {
    const saved = await restoreSaved();
    if (!active) return;
    base = saved;
    const changes = new Map<string, SyncChange<T>>();
    unsubscribe = onSnapshot(
      options.request(base?.checkpoint.lastUpdatedAt ?? null),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (!active) return;
        readSyncChanges(snapshot, changes, options.parse);
        let merged: ReturnType<typeof mergeSyncChanges<T>>;
        try {
          merged = mergeSyncChanges(
            base?.checkpoint ?? { documents: {}, lastUpdatedAt: null },
            base?.values ?? new Map<string, T>(),
            changes
          );
        } catch (error) {
          restoreOnError(error);
          return;
        }
        if (!(snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites)) {
          base = {
            checkpoint: { documents: merged.documents, lastUpdatedAt: merged.lastUpdatedAt },
            values: merged.values,
          };
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
