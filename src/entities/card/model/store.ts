import { getDecks } from "@/entities/deck/@x/card";
import { createStore } from "zustand/vanilla";

import { cardIdSchema } from "./schema";
import type { Card, CardId, RemoteCard } from "./types";

export const cardStore = createStore<{ remoteCards: Card[] }>()(() => ({ remoteCards: [] }));

export function getCards(): Card[] {
  const { remoteCards } = cardStore.getState();
  const decks = getDecks();
  return remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
}

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  return getCards().find((card) => card.id === cardId);
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};
