import type { DocumentData, QuerySnapshot } from "firebase/firestore";
import { firestoreTimestampSchema } from "./firestoreDocument";
import {
  compareSyncTimestamps,
  loadSyncCheckpoint,
  deleteSyncCheckpoint,
  type SyncCheckpoint,
  type SyncTimestamp,
} from "./syncPersistence";

export interface SyncedQueryResult<T> {
  values: T[];
  fromCache: boolean;
  hasPendingWrites: boolean;
}

export interface SyncReplica<T> {
  checkpoint: SyncCheckpoint;
  values: Map<string, T>;
}

export async function loadSyncReplica<T>(
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

export type SyncChange<T> =
  | { success: true; data: DocumentData; value: T; pending: boolean }
  | { success: false; error: unknown };

export function readSyncTimestamp(data: DocumentData): SyncTimestamp {
  const value = firestoreTimestampSchema.parse(data.updatedAt);
  return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}

export function readSyncChanges<T>(
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

export function mergeSyncChanges<T>(base: SyncReplica<T> | null, changes: Map<string, SyncChange<T>>) {
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
