import { filterCardsByDeckId, filterTagsByDeckId } from "../rules";
import type { Card } from "../types";
import { useCards } from "./useCards";

// Reads the Cards and available tags owned by one Deck.
export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
