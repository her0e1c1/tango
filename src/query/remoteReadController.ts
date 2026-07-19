import type { QueryClient, QueryKey } from "@tanstack/react-query";

import { firestoreKeys } from "@/query/firestoreKeys";
import { createFirestoreSyncController, type FirestoreSyncState } from "@/query/firestoreSyncController";
import { toRemoteById, type RemoteById } from "@/query/remoteCollection";
import type { RemoteSnapshot, RemoteSubscriptionProps } from "@/query/remoteReadContract";

export type { RemoteSubscriptionProps } from "@/query/remoteReadContract";

export type RemoteReadState = FirestoreSyncState;

export interface RemoteReadDependencies {
  client: QueryClient;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

export const createRemoteReadController = (dependencies: RemoteReadDependencies) => {
  const syncController = createFirestoreSyncController(["deck", "card"] as const);
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

  const applySnapshot = <T extends { id: string }>(
    uid: string,
    generation: number,
    collection: "deck" | "card",
    queryKey: QueryKey,
    snapshot: RemoteSnapshot<T>
  ) => {
    if (!syncController.isCurrent(uid, generation)) return;
    const previous = dependencies.client.getQueryData<RemoteById<T>>(queryKey) ?? {};
    const next =
      snapshot.type === "replace" ? toRemoteById(snapshot.items) : dependencies.applyChange(previous, snapshot.event);
    dependencies.client.setQueryData(queryKey, next);
    syncController.observe(uid, generation, collection, snapshot.metadata);
  };

  const attachListeners = (uid: string, generation: number) => {
    const onError = (error: Error) => handleListenerError(uid, generation, error);
    const nextDeckSubscription = dependencies.subscribeDecks({
      uid,
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "deck", firestoreKeys.decks(uid), snapshot),
      onError,
    });
    if (!syncController.isCurrent(uid, generation)) {
      nextDeckSubscription();
      return;
    }
    unsubscribeDeck = nextDeckSubscription;

    const nextCardSubscription = dependencies.subscribeCards({
      uid,
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "card", firestoreKeys.cards(uid), snapshot),
      onError,
    });
    if (!syncController.isCurrent(uid, generation)) {
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
    const generation = syncController.start(uid);

    try {
      attachListeners(uid, generation);
      currentStart = Promise.resolve();
    } catch (error) {
      const initializationError = error instanceof Error ? error : new Error(String(error));
      stopListeners();
      syncController.fail(uid, generation, initializationError);
      currentStart = Promise.reject(initializationError);
    }
    return currentStart;
  };

  const handleListenerError = (uid: string, generation: number, error: Error) => {
    if (!syncController.isCurrent(uid, generation)) return;
    stopListeners();
    if (automaticRecoveries >= 1) {
      syncController.fail(uid, generation, error);
      return;
    }

    automaticRecoveries += 1;
    void begin(uid, false);
  };

  return {
    start: (uid: string) => {
      const state = syncController.getSnapshot();
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
      syncController.stop(uid);
    },
    subscribe: syncController.subscribe,
    getSnapshot: syncController.getSnapshot,
  };
};
