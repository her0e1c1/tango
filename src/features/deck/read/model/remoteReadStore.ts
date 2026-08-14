import type { Deck } from "@/entities/deck";

import { clearDecks, replaceDecks } from "@/entities/deck";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { subscribeDeckReads } from "../api/subscribeDeckReads";

export const deckRemoteReadStore = createRemoteReadStore<Deck>({
  subscribe: subscribeDeckReads,
  storeItems: false,
  onSnapshot: (snapshot) => {
    replaceDecks(Object.values(snapshot.itemsById).filter((deck) => deck != null));
  },
});

export const startDeckReads = (uid: string) => {
  if (deckRemoteReadStore.getState().uid !== uid) clearDecks();
  deckRemoteReadStore.getState().start(uid);
};

export const stopDeckReads = (uid?: string) => {
  const shouldClear = uid == null || deckRemoteReadStore.getState().uid === uid;
  deckRemoteReadStore.getState().stop(uid);
  if (shouldClear) clearDecks();
};
