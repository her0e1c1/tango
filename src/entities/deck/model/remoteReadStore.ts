import { subscribeDeckReads } from "@/adapters/firestore/event";
import type { Deck } from "@/entities/deck/model/deck";
import { waitForFirestoreInitialization } from "@/shared/firestore";
import { createRemoteReadStore } from "@/shared/lib/remote-read";

export const deckRemoteReadStore = createRemoteReadStore<Deck>({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeDeckReads,
});

export const startDeckReads = (uid: string) => deckRemoteReadStore.getState().start(uid);
export const stopDeckReads = (uid?: string) => deckRemoteReadStore.getState().stop(uid);
