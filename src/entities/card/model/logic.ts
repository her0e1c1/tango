import type { Card } from "./card";

export const filterCardsByDeckId = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterCardsByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();
