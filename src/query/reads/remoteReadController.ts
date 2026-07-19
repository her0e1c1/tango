import type { RemoteSnapshot } from "@/action/firestore/event";
import type {
  RemoteCache,
  RemoteCollectionName,
  RemoteCollectionTypes,
} from "@/query/cache/remoteCache";
import { toRemoteById, type RemoteById } from "@/query/cache/remoteCollection";
import { createSyncState } from "@/query/reads/syncState";

export interface RemoteSubscriptionProps<T> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}

export interface RemoteReadDependencies {
  cache: RemoteCache;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

export const createRemoteReadController = (dependencies: RemoteReadDependencies) => {
  const syncState = createSyncState(["deck", "card"] as const);
  let activeUid: string | undefined;
  let automaticRecoveries = 0;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;

  const stopListeners = () => {
    const subscriptions = [unsubscribeDeck, unsubscribeCard];
    unsubscribeDeck = undefined;
    unsubscribeCard = undefined;
    subscriptions.forEach((unsubscribe) => {
      try {
        unsubscribe?.();
      } catch {
        // A failing unsubscribe must not leave the other listener active.
      }
    });
  };

  const applySnapshot = <Collection extends RemoteCollectionName>(
    uid: string,
    generation: number,
    syncCollection: "deck" | "card",
    collection: Collection,
    snapshot: RemoteSnapshot<RemoteCollectionTypes[Collection]>
  ) => {
    if (!syncState.isCurrent(uid, generation)) return;
    const previous = dependencies.cache.read(uid, collection);
    const next =
      snapshot.type === "replace" ? toRemoteById(snapshot.items) : dependencies.applyChange(previous, snapshot.event);
    dependencies.cache.replace(uid, collection, next);
    syncState.observe(uid, generation, syncCollection, snapshot.metadata);
  };

  const attachListeners = (uid: string, generation: number) => {
    const onError = (error: Error) => handleListenerError(uid, generation, error);
    const nextDeckSubscription = dependencies.subscribeDecks({
      uid,
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "deck", "decks", snapshot),
      onError,
    });
    if (!syncState.isCurrent(uid, generation)) {
      nextDeckSubscription();
      return;
    }
    unsubscribeDeck = nextDeckSubscription;

    const nextCardSubscription = dependencies.subscribeCards({
      uid,
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "card", "cards", snapshot),
      onError,
    });
    if (!syncState.isCurrent(uid, generation)) {
      nextCardSubscription();
      stopListeners();
      return;
    }
    unsubscribeCard = nextCardSubscription;
  };

  const begin = (uid: string, resetAutomaticRecoveries: boolean) => {
    stopListeners();
    activeUid = uid;
    if (resetAutomaticRecoveries) automaticRecoveries = 0;
    const generation = syncState.start(uid);

    try {
      attachListeners(uid, generation);
      currentStart = Promise.resolve();
    } catch (error) {
      const initializationError = error instanceof Error ? error : new Error(String(error));
      stopListeners();
      syncState.fail(uid, generation, initializationError);
      currentStart = Promise.reject(initializationError);
    }
    return currentStart;
  };

  const handleListenerError = (uid: string, generation: number, error: Error) => {
    if (!syncState.isCurrent(uid, generation)) return;
    stopListeners();
    if (automaticRecoveries >= 1) {
      syncState.fail(uid, generation, error);
      return;
    }

    automaticRecoveries += 1;
    void begin(uid, false);
  };

  return {
    start: (uid: string) => {
      const state = syncState.getSnapshot();
      if (activeUid === uid && (state.status === "loading" || state.status === "ready")) {
        return currentStart ?? Promise.resolve();
      }
      return begin(uid, true);
    },
    retry: () => (activeUid ? begin(activeUid, true) : Promise.resolve()),
    stop: (uid?: string) => {
      if (uid && uid !== activeUid) return;
      stopListeners();
      activeUid = undefined;
      currentStart = undefined;
      syncState.stop(uid);
    },
    subscribe: syncState.subscribe,
    getSnapshot: syncState.getSnapshot,
  };
};
