import type { Card } from "./card";

export const filterByDeckId = (cards: Card[], deckId: string): Card[] => cards.filter((card) => card.deckId === deckId);

export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();
