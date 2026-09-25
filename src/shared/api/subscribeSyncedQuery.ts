import { onSnapshot, type DocumentData, type Query, type QuerySnapshot } from "firebase/firestore";
import {
  saveSyncCheckpoint,
  loadSyncCheckpoint,
  deleteSyncCheckpoint,
  compareSyncTimestamps,
  type SyncCheckpoint,
  type SyncTimestamp,
} from "./syncStorage";
import { firestoreTimestampSchema } from "./firestoreDocument";
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
      options.receive({ values: [...base.values.values()], fromCache: true });
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

export interface SyncedQueryResult<T> {
  values: T[];
  fromCache: boolean;
}

interface SyncReplica<T> {
  checkpoint: SyncCheckpoint;
  values: Map<string, T>;
}

async function loadSyncReplica<T>(
  scope: string,
  parse: (id: string, data: DocumentData) => T
): Promise<SyncReplica<T> | null> {
  const checkpoint = await loadSyncCheckpoint(scope);
  if (!checkpoint) return null;
  try {
    const values = new Map<string, T>();
    for (const [id, data] of Object.entries(checkpoint.documents)) {
      readSyncTimestamp(data);
      values.set(id, parse(id, data));
    }
    return { checkpoint, values };
  } catch {
    await deleteSyncCheckpoint(scope).catch(() => undefined);
    return null;
  }
}

type SyncChange<T> =
  | { success: true; data: DocumentData; value: T; pending: boolean }
  | { success: false; error: unknown };

function readSyncTimestamp(data: DocumentData): SyncTimestamp {
  const value = firestoreTimestampSchema.parse(data.updatedAt);
  return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}

function readSyncChanges<T>(
  snapshot: QuerySnapshot,
  changes: Map<string, SyncChange<T>>,
  parse: (id: string, data: DocumentData) => T
) {
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    const id = change.doc.id;
    if (change.type === "removed") {
      changes.delete(id);
      continue;
    }
    try {
      const data = change.doc.data({ serverTimestamps: "estimate" });
      readSyncTimestamp(data);
      changes.set(id, { success: true, data, value: parse(id, data), pending: change.doc.metadata.hasPendingWrites });
    } catch (error) {
      changes.set(id, { success: false, error });
    }
  }
}

function mergeSyncChanges<T>(base: SyncReplica<T> | null, changes: Map<string, SyncChange<T>>) {
  const values = new Map(base?.values);
  const documents = new Map(Object.entries(base?.checkpoint.documents ?? {}));
  let lastUpdatedAt = base?.checkpoint.lastUpdatedAt ?? null;
  for (const [id, change] of changes) {
    if (!change.success) throw change.error;
    const previous = documents.get(id);
    const updatedAt = readSyncTimestamp(change.data);
    if (!change.pending && previous && compareSyncTimestamps(updatedAt, readSyncTimestamp(previous)) < 0) continue;
    values.set(id, change.value);
    documents.set(id, change.data);
    if (!change.pending && (lastUpdatedAt === null || compareSyncTimestamps(updatedAt, lastUpdatedAt) > 0))
      lastUpdatedAt = updatedAt;
  }
  return { checkpoint: { documents: Object.fromEntries(documents), lastUpdatedAt }, values };
}
