import { subscribeCardReads } from "@/adapters/firestore/event";
import type { Card } from "@/entities/card/model/card";
import { waitForFirestoreInitialization } from "@/shared/firebase/firestore-runtime";
import { createRemoteReadStore, type RemoteReadDependencies } from "@/shared/lib/remote-read/createRemoteReadStore";

export const createCardRemoteReadStore = (dependencies: RemoteReadDependencies<Card>) =>
  createRemoteReadStore(dependencies);

export const cardRemoteReadStore = createCardRemoteReadStore({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeCardReads,
});

export const startCardReads = (uid: string) => cardRemoteReadStore.getState().start(uid);
export const stopCardReads = (uid?: string) => cardRemoteReadStore.getState().stop(uid);
