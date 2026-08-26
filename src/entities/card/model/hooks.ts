import { useStore } from "zustand";

import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

// Hides remote duplicates left by a partial migration while their retryable local Cards still exist.
export const useCards = (): Card[] => {
  const state = useStore(cardStore);
  const localIds = new Set(state.localCards.map((card) => card.id));
  return [...state.remoteCards.filter((card) => !localIds.has(card.id)), ...state.localCards];
};

// Reads one Card with the retryable local record taking precedence over a partial remote copy.
export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(
    cardStore,
    (state) => state.localCards.find((card) => card.id === id) ?? state.remoteCards.find((card) => card.id === id)
  );

// Reads the Cards and available tags owned by one Deck.
export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
