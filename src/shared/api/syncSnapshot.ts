import type { DocumentData, QuerySnapshot } from "firebase/firestore";
import { firestoreTimestampSchema } from "./firestoreDocument";
import { compareSyncTimestamps, type SyncCheckpoint, type SyncTimestamp } from "./syncPersistence";

export interface SyncedQueryResult<T> {
  values: T[];
  fromCache: boolean;
  hasPendingWrites: boolean;
  checkpoint?: SyncCheckpoint | null;
}

export interface SyncChange<T> {
  data: DocumentData;
  value: T;
  pending: boolean;
}

export function readSyncTimestamp(data: DocumentData): SyncTimestamp {
  const value = firestoreTimestampSchema.parse(data.updatedAt);
  return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}

export function readSyncChanges<T>(
  snapshot: QuerySnapshot,
  changes: Map<string, SyncChange<T>>,
  invalid: Map<string, unknown>,
  parse: (id: string, data: DocumentData) => T
) {
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    const id = change.doc.id;
    invalid.delete(id);
    if (change.type === "removed") {
      changes.delete(id);
      continue;
    }
    try {
      const data = change.doc.data({ serverTimestamps: "estimate" });
      readSyncTimestamp(data);
      changes.set(id, { data, value: parse(id, data), pending: change.doc.metadata.hasPendingWrites });
    } catch (error) {
      invalid.set(id, error);
    }
  }
}

export function mergeSyncChanges<T>(
  base: SyncCheckpoint,
  baseValues: Map<string, T>,
  changes: Map<string, SyncChange<T>>
) {
  const values = new Map(baseValues);
  const documents = new Map(Object.entries(base.documents));
  let lastUpdatedAt = base.lastUpdatedAt;
  for (const [id, change] of changes) {
    const previous = documents.get(id);
    const updatedAt = readSyncTimestamp(change.data);
    if (!change.pending && previous && compareSyncTimestamps(updatedAt, readSyncTimestamp(previous)) < 0) continue;
    values.set(id, change.value);
    documents.set(id, change.data);
    if (!change.pending && (lastUpdatedAt === null || compareSyncTimestamps(updatedAt, lastUpdatedAt) > 0))
      lastUpdatedAt = updatedAt;
  }
  return { values, documents: Object.fromEntries(documents), lastUpdatedAt };
}
