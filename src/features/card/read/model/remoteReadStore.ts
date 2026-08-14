import { replaceCards, type Card } from "@/entities/card";
import { createRemoteReadStore } from "@/shared/lib/remote-read";
import { subscribeCardReads } from "../api/subscribeCardReads";

export const cardRemoteReadStore = createRemoteReadStore<Card>({
  subscribe: subscribeCardReads,
});

// Remove this bridge in #773 after the App owns the Card subscription.
cardRemoteReadStore.subscribe((state, previousState) => {
  if (state.status !== "ready" || state.itemsById === previousState.itemsById) return;
  replaceCards(Object.values(state.itemsById).filter((card): card is Card => card !== undefined));
});

export const startCardReads = (uid: string) => cardRemoteReadStore.getState().start(uid);
export const stopCardReads = (uid?: string) => cardRemoteReadStore.getState().stop(uid);
