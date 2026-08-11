import type { StoreApi } from "zustand";
import { createStore } from "zustand/vanilla";

import { subscribeCardReads, subscribeDeckReads } from "@/adapters/firestore/event";
import {
  type FirestoreInitializationResult,
  waitForFirestoreInitialization,
} from "@/shared/firebase/firestore-runtime";
import {
  type RemoteById,
  type RemoteSnapshot,
  type RemoteSnapshotMetadata,
  type RemoteSubscriptionProps,
  type RemoteSyncStatus,
  toRemoteById,
} from "@/domain/remoteSnapshot";
import { applyRealtimeChange } from "@/lib/realtimeChange";

type Unsubscribe = () => void;

export interface RemoteReadDependencies {
  waitForInitialization: () => Promise<FirestoreInitializationResult>;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Unsubscribe;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Unsubscribe;
}

export interface RemoteStoreState {
  readonly uid: string | null;
  readonly status: "idle" | "loading" | "ready" | "blocked" | "error";
  readonly decksById: RemoteById<Deck>;
  readonly cardsById: RemoteById<Card>;
  readonly syncStatus?: RemoteSyncStatus | undefined;
  readonly error?: Error | undefined;
  start: (uid: string) => Promise<void>;
  stop: (uid?: string) => void;
  retry: () => Promise<void>;
}

interface SnapshotMetadata {
  decks?: RemoteSnapshotMetadata;
  cards?: RemoteSnapshotMetadata;
}

const initialReadState = (): Omit<RemoteStoreState, "start" | "stop" | "retry"> => ({
  uid: null,
  status: "idle",
  decksById: {},
  cardsById: {},
  syncStatus: undefined,
  error: undefined,
});

const applySnapshot = <T extends { id: string }>(
  previous: RemoteById<T>,
  snapshot: RemoteSnapshot<T>
): RemoteById<T> =>
  snapshot.type === "replace" ? toRemoteById(snapshot.items) : applyRealtimeChange(previous, snapshot.event);

const deriveSyncStatus = (metadata: SnapshotMetadata): RemoteSyncStatus | undefined => {
  if (metadata.decks == null || metadata.cards == null) return undefined;
  if (metadata.decks.hasPendingWrites || metadata.cards.hasPendingWrites) return "pending";
  if (metadata.decks.fromCache || metadata.cards.fromCache) return "cached";
  return "synced";
};

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

const closeAll = (subscriptions: readonly Unsubscribe[]) => {
  for (const unsubscribe of subscriptions) {
    try {
      unsubscribe();
    } catch {
      // Listener cleanup is best-effort.
    }
  }
};

export const createRemoteStore = (dependencies: RemoteReadDependencies): StoreApi<RemoteStoreState> => {
  let activeUid: string | null = null;
  let generation = 0;
  let metadata: SnapshotMetadata = {};
  let activeSubscriptions: Unsubscribe[] = [];

  const closeActiveSubscriptions = () => {
    const subscriptions = activeSubscriptions;
    activeSubscriptions = [];
    closeAll(subscriptions);
  };

  return createStore<RemoteStoreState>()((set, get) => {
    const isCurrent = (uid: string, operationGeneration: number) =>
      activeUid === uid && generation === operationGeneration;

    const fail = (uid: string, operationGeneration: number, status: "blocked" | "error", cause: unknown) => {
      if (!isCurrent(uid, operationGeneration)) return;
      generation += 1;
      closeActiveSubscriptions();
      set({ status, syncStatus: undefined, error: toError(cause) });
    };

    const start = async (uid: string): Promise<void> => {
      const operationGeneration = ++generation;
      const previous = get();
      closeActiveSubscriptions();
      activeUid = uid;
      metadata = {};

      const retainCurrentData = previous.uid === uid;
      set({
        uid,
        status: "loading",
        decksById: retainCurrentData ? previous.decksById : {},
        cardsById: retainCurrentData ? previous.cardsById : {},
        syncStatus: undefined,
        error: undefined,
      });

      let initialization: FirestoreInitializationResult;
      try {
        initialization = await dependencies.waitForInitialization();
      } catch (cause) {
        fail(uid, operationGeneration, "error", cause);
        throw toError(cause);
      }

      if (!isCurrent(uid, operationGeneration)) return;
      if (initialization.status === "blocked") {
        fail(uid, operationGeneration, "blocked", initialization.error);
        return;
      }

      const subscriptions: Unsubscribe[] = [];
      const readiness = () => {
        const syncStatus = deriveSyncStatus(metadata);
        return {
          status: syncStatus == null ? ("loading" as const) : ("ready" as const),
          syncStatus,
          error: undefined,
        };
      };
      const onError = (error: Error) => fail(uid, operationGeneration, "error", error);

      try {
        subscriptions.push(
          dependencies.subscribeDecks({
            uid,
            onError,
            onSnapshot: (snapshot) => {
              if (!isCurrent(uid, operationGeneration)) return;
              metadata = { ...metadata, decks: { ...snapshot.metadata } };
              set({
                decksById: applySnapshot(get().decksById, snapshot),
                ...readiness(),
              });
            },
          })
        );
        if (!isCurrent(uid, operationGeneration)) {
          closeAll(subscriptions);
          return;
        }

        subscriptions.push(
          dependencies.subscribeCards({
            uid,
            onError,
            onSnapshot: (snapshot) => {
              if (!isCurrent(uid, operationGeneration)) return;
              metadata = { ...metadata, cards: { ...snapshot.metadata } };
              set({
                cardsById: applySnapshot(get().cardsById, snapshot),
                ...readiness(),
              });
            },
          })
        );
        if (!isCurrent(uid, operationGeneration)) {
          closeAll(subscriptions);
          return;
        }
        activeSubscriptions = subscriptions;
      } catch (cause) {
        closeAll(subscriptions);
        fail(uid, operationGeneration, "error", cause);
        throw toError(cause);
      }
    };

    const stop = (uid?: string) => {
      if (uid != null && activeUid !== uid) return;
      generation += 1;
      activeUid = null;
      metadata = {};
      closeActiveSubscriptions();
      set(initialReadState());
    };

    const retry = () => (activeUid == null ? Promise.resolve() : start(activeUid));

    return {
      ...initialReadState(),
      start,
      stop,
      retry,
    };
  });
};

export { toRemoteById };

export const remoteStore = createRemoteStore({
  waitForInitialization: waitForFirestoreInitialization,
  subscribeDecks: subscribeDeckReads,
  subscribeCards: subscribeCardReads,
});
