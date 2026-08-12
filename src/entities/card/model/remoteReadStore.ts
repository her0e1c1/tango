import { subscribeCardReads } from "@/adapters/firestore/event";
import type { Card } from "@/entities/card/model/card";
import { waitForFirestoreInitialization } from "@/shared/firebase/firestore-runtime";
import { createRemoteReadStore } from "@/shared/lib/remote-read/createRemoteReadStore";

export const cardRemoteReadStore = createRemoteReadStore<Card>({
  waitForInitialization: waitForFirestoreInitialization,
  subscribe: subscribeCardReads,
});

export const startCardReads = (uid: string) => cardRemoteReadStore.getState().start(uid);
export const stopCardReads = (uid?: string) => cardRemoteReadStore.getState().stop(uid);
