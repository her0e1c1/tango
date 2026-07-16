import * as firestore from "@/action/firestore";
import {
  getFirestoreInitializationState,
  subscribeFirestoreInitialization,
  waitForFirestoreInitialization,
} from "@/firestoreRuntime";
import { applyRealtimeChange } from "@/lib/realtimeChange";
import { queryClient } from "@/query/client";
import { createRemoteReadController } from "@/query/remoteReadController";

export const remoteReadController = createRemoteReadController({
  client: queryClient,
  subscribeDecks: firestore.event.subscribeDeckReads,
  subscribeCards: firestore.event.subscribeCardReads,
  applyChange: applyRealtimeChange,
});

export const getRemoteReadBlocker = () => {
  const state = getFirestoreInitializationState();
  return state.status === "blocked" ? state.error : undefined;
};
export const subscribeRemoteReadBlocker = subscribeFirestoreInitialization;

let requestedUid: string | undefined;

export const startRemoteReads = async (uid: string) => {
  requestedUid = uid;
  const initialization = await waitForFirestoreInitialization();
  if (initialization.status === "blocked" || requestedUid !== uid) return;
  return remoteReadController.start(uid);
};

export const stopRemoteReads = (uid?: string) => {
  if (!uid || requestedUid === uid) requestedUid = undefined;
  remoteReadController.stop(uid);
};

export const retryRemoteReads = () => remoteReadController.retry();
export const subscribeRemoteReadState = remoteReadController.subscribe;
export const getRemoteReadState = remoteReadController.getSnapshot;
