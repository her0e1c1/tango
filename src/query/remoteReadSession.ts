import * as firestore from "@/action/firestore";
import { applyRealtimeChange } from "@/lib/realtimeChange";
import { queryClient } from "@/query/client";
import { createRemoteReadController } from "@/query/remoteReadController";

export const remoteReadController = createRemoteReadController({
  client: queryClient,
  readDecks: firestore.deck.readAll,
  readCards: firestore.card.readAll,
  subscribeDecks: firestore.event.subscribeDeckReads,
  subscribeCards: firestore.event.subscribeCardReads,
  applyChange: applyRealtimeChange,
});

export const startRemoteReads = (uid: string) => remoteReadController.start(uid);

export const stopRemoteReads = (uid?: string) => remoteReadController.stop(uid);

export const retryRemoteReads = () => remoteReadController.retry();
export const subscribeRemoteReadState = remoteReadController.subscribe;
export const getRemoteReadState = remoteReadController.getSnapshot;
