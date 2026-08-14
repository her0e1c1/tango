import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import type { RemoteById, RemoteSubscriptionProps, RemoteSyncStatus } from "@/shared/api";

type Unsubscribe = () => void;

export interface RemoteReadDependencies<T extends { id: string }> {
  subscribe: (props: RemoteSubscriptionProps<T>) => Unsubscribe;
}

export interface RemoteReadStoreState<T extends { id: string }> {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "error";
  readonly itemsById: RemoteById<T>;
  readonly syncStatus?: RemoteSyncStatus | undefined;
  readonly error?: Error | undefined;
  start: (uid: string) => void;
  stop: (uid?: string) => void;
  retry: () => void;
}

const initialReadState = <T extends { id: string }>(): Omit<RemoteReadStoreState<T>, "start" | "stop" | "retry"> => ({
  uid: null,
  status: "idle",
  itemsById: {},
  syncStatus: undefined,
  error: undefined,
});

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

export const createRemoteReadStore = <T extends { id: string }>(
  dependencies: RemoteReadDependencies<T>
): StoreApi<RemoteReadStoreState<T>> => {
  let currentSubscription: { unsubscribe?: Unsubscribe } | undefined;

  return createStore<RemoteReadStoreState<T>>()((set, get) => {
    const start = (uid: string) => {
      const previous = get();
      const previousSubscription = currentSubscription;
      currentSubscription = undefined;
      previousSubscription?.unsubscribe?.();

      set({
        uid,
        status: "loading",
        itemsById: previous.uid === uid ? previous.itemsById : {},
        syncStatus: undefined,
        error: undefined,
      });

      const subscription: { unsubscribe?: Unsubscribe } = {};
      currentSubscription = subscription;
      try {
        subscription.unsubscribe = dependencies.subscribe({
          uid,
          onError: (error) => {
            if (currentSubscription !== subscription) return;
            currentSubscription = undefined;
            set({ status: "error", syncStatus: undefined, error });
            subscription.unsubscribe?.();
          },
          onSnapshot: (snapshot) => {
            if (currentSubscription !== subscription) return;
            set({
              itemsById: snapshot.itemsById,
              status: "ready",
              syncStatus: snapshot.syncStatus,
              error: undefined,
            });
          },
        });
      } catch (cause) {
        if (currentSubscription !== subscription) return;
        currentSubscription = undefined;
        set({ status: "error", syncStatus: undefined, error: toError(cause) });
      }
      if (currentSubscription !== subscription) subscription.unsubscribe?.();
    };

    const stop = (uid?: string) => {
      if (uid != null && get().uid !== uid) return;
      const subscription = currentSubscription;
      currentSubscription = undefined;
      subscription?.unsubscribe?.();
      set(initialReadState<T>());
    };

    const retry = () => {
      const uid = get().uid;
      if (uid != null) start(uid);
    };

    return {
      ...initialReadState<T>(),
      start,
      stop,
      retry,
    };
  });
};
