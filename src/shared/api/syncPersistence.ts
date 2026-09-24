import { Timestamp, type DocumentData } from "firebase/firestore";
import type { PersistOptions, PersistStorage } from "zustand/middleware";
import { z } from "zod";

const syncTimestampSchema = z.object({
  seconds: z.number().int().min(-62_135_596_800).max(253_402_300_799),
  nanoseconds: z.number().int().min(0).max(999_999_999),
});

export type SyncTimestamp = z.infer<typeof syncTimestampSchema>;

export interface SyncCheckpoint {
  documents: Record<string, DocumentData>;
  lastUpdatedAt: SyncTimestamp | null;
  documentCount: number;
}

export interface SyncState {
  sync: Record<string, SyncCheckpoint>;
}

const checkpointSchema = z
  .object({
    documents: z.record(z.string(), z.record(z.string(), z.unknown())),
    lastUpdatedAt: syncTimestampSchema.nullable(),
    documentCount: z.number().int().nonnegative(),
  })
  .refine((value) => Object.keys(value.documents).length === value.documentCount);

// A single IndexedDB record contains both the data and its resume position.
// Never save a cursor separately: an interrupted write must leave the previous pair intact.
async function transact<T>(
  name: string,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>
) {
  if (typeof indexedDB === "undefined") return undefined;
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

function createSyncStorage(): PersistStorage<SyncState> {
  let previous: SyncState["sync"] | undefined;
  let pending: Promise<unknown> = Promise.resolve();
  return {
    async getItem(name) {
      try {
        await pending.catch(() => undefined);
        const value: unknown = await transact(name, "readonly", (store) => store.get(name));
        const parsed: unknown = typeof value === "string" ? JSON.parse(value, reviveTimestamp) : null;
        const envelope = z
          .object({ state: z.object({ sync: z.record(z.string(), z.unknown()) }), version: z.number() })
          .safeParse(parsed);
        if (!envelope.success) return null;
        const sync: SyncState["sync"] = {};
        for (const [scope, candidate] of Object.entries(envelope.data.state.sync)) {
          const checkpoint = checkpointSchema.safeParse(candidate);
          if (checkpoint.success) sync[scope] = checkpoint.data;
        }
        return { state: { sync }, version: envelope.data.version };
      } catch {
        // An unavailable or corrupt replica cannot supply a valid resume position.
        return null;
      }
    },
    setItem(name, value) {
      if (previous === value.state.sync) return pending;
      previous = value.state.sync;
      const serialized = JSON.stringify(value);
      pending = pending
        .catch(() => undefined)
        .then(() => transact(name, "readwrite", (store) => store.put(serialized, name)));
      // Public synchronous state actions need not await persistence. Subscription callers
      // still receive the original rejection and can report a failed durable save.
      void pending.catch(() => {
        if (previous === value.state.sync) previous = undefined;
      });
      return pending;
    },
    removeItem(name) {
      previous = undefined;
      pending = pending.catch(() => undefined).then(() => transact(name, "readwrite", (store) => store.delete(name)));
      void pending.catch(() => undefined);
      return pending;
    },
  };
}

export function syncPersistence<State extends SyncState>(name: string): PersistOptions<State, SyncState> {
  return {
    name,
    version: 1,
    skipHydration: true,
    storage: createSyncStorage(),
    partialize: ({ sync }) => ({ sync }),
    merge(persisted, current) {
      const input = z.object({ sync: z.record(z.string(), z.unknown()) }).safeParse(persisted);
      const sync: SyncState["sync"] = {};
      if (input.success) {
        for (const [scope, value] of Object.entries(input.data.sync)) {
          const checkpoint = checkpointSchema.safeParse(value);
          if (checkpoint.success) sync[scope] = checkpoint.data;
        }
      }
      return { ...current, sync };
    },
  };
}

export function compareSyncTimestamps(left: SyncTimestamp, right: SyncTimestamp): number {
  return left.seconds - right.seconds || left.nanoseconds - right.nanoseconds;
}
