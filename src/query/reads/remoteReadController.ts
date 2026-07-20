/**
 * @file Coordinates remote read behavior for Remote Read Controller.
 * It turns Firestore subscriptions into observable application state while handling restarts,
 * stale callbacks, and errors.
 */

import { toRemoteById } from "@/query/cache/remoteCollection";
import type { RemoteSnapshot, RemoteSubscriptionProps } from "@/query/remoteReadContract";
import type {
  RemoteById,
  RemoteCollectionName,
  RemoteCollectionTypes,
  RemoteState,
  RemoteStore,
} from "@/store/remoteStore";

export type { RemoteSubscriptionProps } from "@/query/remoteReadContract";

export interface RemoteReadDependencies {
  store: RemoteStore;
  subscribeDecks: (props: RemoteSubscriptionProps<Deck>) => Callback;
  subscribeCards: (props: RemoteSubscriptionProps<Card>) => Callback;
  applyChange: <T extends { id: string }>(
    previous: RemoteById<T>,
    event: { added?: T[]; modified?: T[]; removed?: string[] }
  ) => RemoteById<T>;
}

const readCollection = <Collection extends RemoteCollectionName>(
  state: RemoteState,
  collection: Collection
): RemoteById<RemoteCollectionTypes[Collection]> =>
  (collection === "decks" ? state.decksById : state.cardsById) as RemoteById<RemoteCollectionTypes[Collection]>;

/**
 * Creates and configures a remote read controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createRemoteReadController = (dependencies: RemoteReadDependencies) => {
  let activeUid: string | undefined;
  let generation = 0;
  let automaticRecoveries = 0;
  let unsubscribeDeck: Callback | undefined;
  let unsubscribeCard: Callback | undefined;
  let currentStart: Promise<void> | undefined;

  const isCurrent = (uid: string, currentGeneration: number) => activeUid === uid && generation === currentGeneration;

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
   * Applies a current Firestore snapshot to the in-memory remote Store.
   * Snapshots from an older user or subscription generation are ignored so stale network callbacks
   * cannot overwrite newer data.
   */
  const applySnapshot = <Collection extends RemoteCollectionName>(
    uid: string,
    generation: number,
    collection: Collection,
    snapshot: RemoteSnapshot<RemoteCollectionTypes[Collection]>
  ) => {
    if (!isCurrent(uid, generation)) return;
    const state = dependencies.store.getSnapshot();
    const previous = readCollection(state, collection);
    const next =
      snapshot.type === "replace" ? toRemoteById(snapshot.items) : dependencies.applyChange(previous, snapshot.event);
    dependencies.store.applySnapshot(uid, collection, { data: next, metadata: snapshot.metadata });
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
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "decks", snapshot),
      onError,
    });
    if (!isCurrent(uid, generation)) {
      nextDeckSubscription();
      return;
    }
    unsubscribeDeck = nextDeckSubscription;

    const nextCardSubscription = dependencies.subscribeCards({
      uid,
      onSnapshot: (snapshot) => applySnapshot(uid, generation, "cards", snapshot),
      onError,
    });
    if (!isCurrent(uid, generation)) {
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
    const currentGeneration = ++generation;
    dependencies.store.begin(uid);

    try {
      attachListeners(uid, currentGeneration);
      currentStart = Promise.resolve();
    } catch (error) {
      const initializationError = error instanceof Error ? error : new Error(String(error));
      stopListeners();
      dependencies.store.fail(uid, initializationError);
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
    if (!isCurrent(uid, generation)) return;
    stopListeners();
    if (automaticRecoveries >= 1) {
      dependencies.store.fail(uid, error);
      return;
    }

    automaticRecoveries += 1;
    void begin(uid, false);
  };

  return {
    start: (uid: string) => {
      const state = dependencies.store.getSnapshot();
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
      generation += 1;
      dependencies.store.clear(uid);
    },
    subscribe: dependencies.store.subscribe,
    getSnapshot: dependencies.store.getSnapshot,
  };
};
