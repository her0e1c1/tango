import { Timestamp } from "firebase/firestore";
import { z } from "zod";

const syncTimestampSchema = z.object({
  seconds: z.number().int().min(-62_135_596_800).max(253_402_300_799),
  nanoseconds: z.number().int().min(0).max(999_999_999),
});

export type SyncTimestamp = z.infer<typeof syncTimestampSchema>;

const checkpointSchema = z
  .object({
    documents: z.record(z.string(), z.record(z.string(), z.unknown())),
    lastUpdatedAt: syncTimestampSchema.nullable(),
  })
  .strict();

export type SyncCheckpoint = z.infer<typeof checkpointSchema>;

// A single IndexedDB record contains both the data and its resume position.
// Never save a cursor separately: an interrupted write must leave the previous pair intact.
async function transact<T>(
  name: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  if (typeof indexedDB === "undefined") return;
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("tango-firestore-sync", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("state");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(`Cannot open ${name}`));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction("state", mode);
      const request = operation(transaction.objectStore("state"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? new Error(`Cannot persist ${name}`));
      transaction.onerror = () => reject(transaction.error ?? new Error(`Cannot persist ${name}`));
    });
  } finally {
    database.close();
  }
}

function reviveTimestamp(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && "type" in value && value.type === "firestore/timestamp/1.0") {
    const timestamp = syncTimestampSchema.safeParse(value);
    if (timestamp.success) return new Timestamp(timestamp.data.seconds, timestamp.data.nanoseconds);
  }
  return value;
}

export async function loadSyncCheckpoint(scope: string): Promise<SyncCheckpoint | null> {
  const value: unknown = await transact(scope, "readonly", (store) => store.get(scope)).catch(() => undefined);
  if (value === undefined) return null;
  try {
    return checkpointSchema.parse(JSON.parse(z.string().parse(value), reviveTimestamp));
  } catch {
    await deleteSyncCheckpoint(scope).catch(() => undefined);
    return null;
  }
}

export function saveSyncCheckpoint(scope: string, checkpoint: SyncCheckpoint) {
  const serialized = JSON.stringify(checkpoint);
  return transact(scope, "readwrite", (store) => store.put(serialized, scope));
}

export function deleteSyncCheckpoint(scope: string) {
  return transact(scope, "readwrite", (store) => store.delete(scope));
}

export function compareSyncTimestamps(left: SyncTimestamp, right: SyncTimestamp): number {
  return left.seconds - right.seconds || left.nanoseconds - right.nanoseconds;
}
