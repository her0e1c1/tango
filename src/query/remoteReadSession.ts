import * as firestore from "@/action/firestore";
import { applyRealtimeChange } from "@/lib/realtimeChange";
import { queryClient } from "@/query/client";
import { createRemoteReadController } from "@/query/remoteReadController";

export interface RemoteReadMirrors {
  mirrorDecks: (decks: Deck[]) => void;
  mirrorCards: (cards: Card[]) => void;
}

const emptyMirrors: RemoteReadMirrors = {
  mirrorDecks: () => undefined,
  mirrorCards: () => undefined,
};

let mirrors = emptyMirrors;

export const remoteReadController = createRemoteReadController({
  client: queryClient,
  readDecks: firestore.deck.readAll,
  readCards: firestore.card.readAll,
  subscribeDecks: firestore.event.subscribeDeckReads,
  subscribeCards: firestore.event.subscribeCardReads,
  mirrorDecks: (decks) => mirrors.mirrorDecks(decks),
  mirrorCards: (cards) => mirrors.mirrorCards(cards),
  applyChange: applyRealtimeChange,
});

export const startRemoteReads = (uid: string, nextMirrors: RemoteReadMirrors) => {
  mirrors = nextMirrors;
  return remoteReadController.start(uid);
};

export const stopRemoteReads = (uid?: string) => {
  remoteReadController.stop(uid);
  if (remoteReadController.getSnapshot().status === "idle") mirrors = emptyMirrors;
};

export const retryRemoteReads = () => remoteReadController.retry();
export const subscribeRemoteReadState = remoteReadController.subscribe;
export const getRemoteReadState = remoteReadController.getSnapshot;
