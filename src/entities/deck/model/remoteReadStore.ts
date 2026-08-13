import type { Deck } from "./deck";
import { waitForFirestoreInitialization } from "@/shared/firestore";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { subscribeDeckReads } from "../api/subscribeDeckReads";

export const deckRemoteReadStore = createRemoteReadStore<Deck>({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeDeckReads,
});

export const startDeckReads = (uid: string) => deckRemoteReadStore.getState().start(uid);
export const stopDeckReads = (uid?: string) => deckRemoteReadStore.getState().stop(uid);
