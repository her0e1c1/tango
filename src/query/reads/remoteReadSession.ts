/**
 * @file Coordinates remote read behavior for Remote Read Session.
 * It turns Firestore subscriptions into observable application state while handling restarts,
 * stale callbacks, and errors.
 */

import {
  event,
  getFirestoreInitializationState,
  subscribeFirestoreInitialization,
  waitForFirestoreInitialization,
} from "@/adapters/firestore";
import { applyRealtimeChange } from "@/lib/realtimeChange";
import { createRemoteCache } from "@/query/cache/remoteCache";
import { queryClient } from "@/query/client";
import { createRemoteReadController } from "@/query/reads/remoteReadController";

export const remoteReadController = createRemoteReadController({
  cache: createRemoteCache(queryClient),
  subscribeDecks: event.subscribeDeckReads,
  subscribeCards: event.subscribeCardReads,
  applyChange: applyRealtimeChange,
});

/**
 * Returns the Firestore startup error that currently prevents remote reads, if any.
 * Route feedback uses this value to explain why retrying data subscriptions is unavailable.
 */
export const getRemoteReadBlocker = () => {
  const state = getFirestoreInitializationState();
  return state.status === "blocked" ? state.error : undefined;
};
/**
 * Subscribes to Firestore startup-state changes that can block remote reads.
 * The alias exposes only the initialization signal needed by the remote-read boundary.
 */
export const subscribeRemoteReadBlocker = subscribeFirestoreInitialization;

let requestedUid: string | undefined;

/**
 * Waits for Firestore initialization, then starts deck and card subscriptions for one user.
 * A superseded user request or blocked database prevents stale subscriptions from starting.
 */
export const startRemoteReads = async (uid: string) => {
  requestedUid = uid;
  const initialization = await waitForFirestoreInitialization();
  if (initialization.status === "blocked" || requestedUid !== uid) return;
  return remoteReadController.start(uid);
};

/**
 * Cancels the requested user's remote subscriptions and clears the pending user when appropriate.
 * Passing an older user identifier cannot stop reads that already belong to a newer account.
 */
export const stopRemoteReads = (uid?: string) => {
  if (!uid || requestedUid === uid) requestedUid = undefined;
  remoteReadController.stop(uid);
};

/**
 * Restarts remote subscriptions for the currently active user after a visible read failure.
 * If no user is active, the operation completes without starting a subscription.
 */
export const retryRemoteReads = () => remoteReadController.retry();
/**
 * Subscribes to loading, ready, and error changes from the remote-read controller.
 * React uses the returned cleanup function to stop observing when the boundary unmounts.
 */
export const subscribeRemoteReadState = remoteReadController.subscribe;
/**
 * Returns the current remote-read state snapshot.
 * Consumers read the same snapshot that subscription callbacks publish.
 */
export const getRemoteReadState = remoteReadController.getSnapshot;
