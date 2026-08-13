import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import {
  toRemoteById,
  type RemoteById,
  type RemoteSnapshot,
  type RemoteSnapshotMetadata,
  type RemoteSubscriptionProps,
  type RemoteSyncStatus,
} from "@/shared/api";
import type { FirestoreInitializationResult } from "@/shared/firestore";
import { applyRealtimeChange } from "@/shared/lib/realtimeChange";

type Unsubscribe = () => void;

export interface RemoteReadDependencies<T> {
  waitForInitialization: () => Promise<FirestoreInitializationResult>;
  subscribe: (props: RemoteSubscriptionProps<T>) => Unsubscribe;
}

export interface RemoteReadStoreState<T extends { id: string }> {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "blocked" | "error";
  readonly itemsById: RemoteById<T>;
  readonly syncStatus?: RemoteSyncStatus | undefined;
  readonly error?: Error | undefined;
  start: (uid: string) => Promise<void>;
  stop: (uid?: string) => void;
  retry: () => Promise<void>;
}

const initialReadState = <T extends { id: string }>(): Omit<RemoteReadStoreState<T>, "start" | "stop" | "retry"> => ({
  uid: null,
  status: "idle",
  itemsById: {},
  syncStatus: undefined,
  error: undefined,
});

const applySnapshot = <T extends { id: string }>(
  previous: RemoteById<T>,
  snapshot: RemoteSnapshot<T>
): RemoteById<T> =>
  snapshot.type === "replace" ? toRemoteById(snapshot.items) : applyRealtimeChange(previous, snapshot.event);

const deriveSyncStatus = (metadata: RemoteSnapshotMetadata): RemoteSyncStatus => {
  if (metadata.hasPendingWrites) return "pending";
  if (metadata.fromCache) return "cached";
  return "synced";
};

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

export const createRemoteReadStore = <T extends { id: string }>(
  dependencies: RemoteReadDependencies<T>
): StoreApi<RemoteReadStoreState<T>> => {
  let generation = 0;
  let unsubscribe: Unsubscribe | undefined;

  return createStore<RemoteReadStoreState<T>>()((set, get) => {
    const fail = (currentGeneration: number, status: "blocked" | "error", cause: unknown) => {
      if (currentGeneration !== generation) return;
      set({ status, syncStatus: undefined, error: toError(cause) });
    };

    const start = async (uid: string): Promise<void> => {
      const previous = get();
      const currentGeneration = ++generation;
      unsubscribe?.();
      unsubscribe = undefined;

      set({
        uid,
        status: "loading",
        itemsById: previous.uid === uid ? previous.itemsById : {},
        syncStatus: undefined,
        error: undefined,
      });

      let initialization: FirestoreInitializationResult;
      try {
        initialization = await dependencies.waitForInitialization();
      } catch (cause) {
        const error = toError(cause);
        fail(currentGeneration, "error", error);
        throw error;
      }

      if (currentGeneration !== generation) return;
      if (initialization.status === "blocked") {
        fail(currentGeneration, "blocked", initialization.error);
        return;
      }

      const nextUnsubscribe = dependencies.subscribe({
        uid,
        onError: (error) => fail(currentGeneration, "error", error),
        onSnapshot: (snapshot) => {
          if (currentGeneration !== generation) return;
          set({
            itemsById: applySnapshot(get().itemsById, snapshot),
            status: "ready",
            syncStatus: deriveSyncStatus(snapshot.metadata),
            error: undefined,
          });
        },
      });
      if (currentGeneration !== generation) {
        nextUnsubscribe();
        return;
      }
      unsubscribe = nextUnsubscribe;
    };

    const stop = (uid?: string) => {
      if (uid != null && get().uid !== uid) return;
      generation += 1;
      unsubscribe?.();
      unsubscribe = undefined;
      set(initialReadState<T>());
    };

    const retry = () => {
      const uid = get().uid;
      return uid == null ? Promise.resolve() : start(uid);
    };

    return {
      ...initialReadState<T>(),
      start,
      stop,
      retry,
    };
  });
};
