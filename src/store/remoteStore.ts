import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";

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
} from "@/shared/api/remoteSnapshot";
import { applyRealtimeChange } from "@/shared/lib/realtimeChange";

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

interface ReadSession {
  readonly uid: string;
  readonly metadata: SnapshotMetadata;
  readonly subscriptions: Unsubscribe[];
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

const readinessState = (metadata: SnapshotMetadata): Pick<RemoteStoreState, "status" | "syncStatus" | "error"> => {
  const syncStatus = deriveSyncStatus(metadata);
  return {
    status: syncStatus == null ? "loading" : "ready",
    syncStatus,
    error: undefined,
  };
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
  let activeSession: ReadSession | undefined;

  const isCurrent = (session: ReadSession) => activeSession === session;

  const cleanupSession = (session: ReadSession | undefined) => {
    if (session == null) return;
    const subscriptions = session.subscriptions.splice(0);
    closeAll(subscriptions);
  };

  const addSubscription = (session: ReadSession, unsubscribe: Unsubscribe) => {
    session.subscriptions.push(unsubscribe);
    if (isCurrent(session)) return true;
    cleanupSession(session);
    return false;
  };

  return createStore<RemoteStoreState>()((set, get) => {
    const fail = (session: ReadSession, status: "blocked" | "error", cause: unknown) => {
      if (!isCurrent(session)) return;
      activeSession = undefined;
      cleanupSession(session);
      set({ status, syncStatus: undefined, error: toError(cause) });
    };

    const start = async (uid: string): Promise<void> => {
      const previous = get();
      const previousSession = activeSession;
      const session: ReadSession = { uid, metadata: {}, subscriptions: [] };
      activeSession = session;
      cleanupSession(previousSession);
      if (!isCurrent(session)) return;

      const retainCurrentData = previous.uid === session.uid;
      set({
        uid: session.uid,
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
        fail(session, "error", cause);
        throw toError(cause);
      }

      if (!isCurrent(session)) return;
      if (initialization.status === "blocked") {
        fail(session, "blocked", initialization.error);
        return;
      }

      const onError = (error: Error) => fail(session, "error", error);

      try {
        const deckSubscription = dependencies.subscribeDecks({
          uid: session.uid,
          onError,
          onSnapshot: (snapshot) => {
            if (!isCurrent(session)) return;
            session.metadata.decks = { ...snapshot.metadata };
            set({
              decksById: applySnapshot(get().decksById, snapshot),
              ...readinessState(session.metadata),
            });
          },
        });
        if (!addSubscription(session, deckSubscription)) return;

        const cardSubscription = dependencies.subscribeCards({
          uid: session.uid,
          onError,
          onSnapshot: (snapshot) => {
            if (!isCurrent(session)) return;
            session.metadata.cards = { ...snapshot.metadata };
            set({
              cardsById: applySnapshot(get().cardsById, snapshot),
              ...readinessState(session.metadata),
            });
          },
        });
        if (!addSubscription(session, cardSubscription)) return;
      } catch (cause) {
        if (isCurrent(session)) {
          fail(session, "error", cause);
        } else {
          cleanupSession(session);
        }
        throw toError(cause);
      }
    };

    const stop = (uid?: string) => {
      if (uid != null && get().uid !== uid) return;
      const session = activeSession;
      activeSession = undefined;
      cleanupSession(session);
      set(initialReadState());
    };

    const retry = () => {
      const uid = get().uid;
      return uid == null ? Promise.resolve() : start(uid);
    };

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
