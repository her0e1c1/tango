import type { Card } from "@/entities/card";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { subscribeCardReads } from "../api/subscribeCardReads";

export const cardRemoteReadStore = createRemoteReadStore<Card>({
  subscribe: subscribeCardReads,
});

export const startCardReads = (uid: string) => cardRemoteReadStore.getState().start(uid);
export const stopCardReads = (uid?: string) => cardRemoteReadStore.getState().stop(uid);
