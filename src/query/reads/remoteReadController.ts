/**
 * @file Coordinates remote read behavior for Remote Read Controller.
 * It turns Firestore subscriptions into observable application state while handling restarts,
 * stale callbacks, and errors.
 */

import type { RemoteCache, RemoteCollectionName, RemoteCollectionTypes } from "@/query/cache/remoteCache";
import { toRemoteById, type RemoteById } from "@/query/cache/remoteCollection";
import type { RemoteSnapshot, RemoteSubscriptionProps } from "@/query/remoteReadContract";
import { createSyncState } from "@/query/reads/syncState";

export type { RemoteSubscriptionProps } from "@/query/remoteReadContract";

export interface RemoteReadDependencies {
  cache: RemoteCache;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

/**
 * Creates and configures a remote read controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createRemoteReadController = (dependencies: RemoteReadDependencies) => {
  const syncState = createSyncState(["deck", "card"] as const);
  let activeUid: string | undefined;
  let automaticRecoveries = 0;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;

  /**
   * Stops every active remote listener and clears the stored unsubscribe callbacks.
   * Each listener is attempted independently so one cleanup failure cannot leave another
   * subscription running.
   */
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

  /**
   * Applies a current Firestore snapshot to the in-memory remote cache.
   * Snapshots from an older user or subscription generation are ignored so stale network callbacks
   * cannot overwrite newer data.
   */
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

  /**
   * Subscribes to deck and card changes for one authenticated user.
   * It immediately disposes subscriptions that become stale while they are being created.
   */
  const attachListeners = (uid: string, generation: number) => {
    /**
     * Handles the error callback for the remote-data layer.
     * The handler translates the event or asynchronous result into the next state change or
     * operation.
     */
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

  /**
   * Starts a new generation of remote reads for the selected user.
   * Existing listeners are stopped first, and synchronous setup failures become observable read
   * errors.
   */
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

  /**
   * Handles a failure reported by an active Firestore listener.
   * The controller retries once automatically, then exposes a stable error that the user can retry
   * manually.
   */
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
