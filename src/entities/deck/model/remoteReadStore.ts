import { subscribeDeckReads } from "@/adapters/firestore/event";
import type { Deck } from "@/entities/deck/model/deck";
import { waitForFirestoreInitialization } from "@/shared/firebase/firestore-runtime";
import { createRemoteReadStore, type RemoteReadDependencies } from "@/shared/lib/remote-read/createRemoteReadStore";

export const createDeckRemoteReadStore = (dependencies: RemoteReadDependencies<Deck>) =>
  createRemoteReadStore(dependencies);

export const deckRemoteReadStore = createDeckRemoteReadStore({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeDeckReads,
});

export const startDeckReads = (uid: string) => deckRemoteReadStore.getState().start(uid);
export const stopDeckReads = (uid?: string) => deckRemoteReadStore.getState().stop(uid);
