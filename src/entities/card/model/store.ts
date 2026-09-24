import { getDecks, useDecks } from "@/entities/deck/@x/card";
import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
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

export const useCards = (): Card[] => {
  const { remoteCards } = useStore(cardStore);
  const decks = useDecks();
  return remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
};

export const useCard = (id: CardId | undefined): Card | undefined => useCards().find((card) => card.id === id);

export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};
