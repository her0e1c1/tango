import { useStore } from "zustand";

import { useDecks } from "@/entities/deck/@x/card";
import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

export const useCards = (): Card[] => {
  const { cardsById } = useStore(cardStore);
  const decks = useDecks();
  return Object.values(cardsById)
    .filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid))
    .sort((left, right) => left.id.localeCompare(right.id));
};

export const useCard = (id: CardId | undefined): Card | undefined => useCards().find((card) => card.id === id);

export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
