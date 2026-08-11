import type { Card } from "./card";

export const selectCardsForDeck = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const selectTagsForDeck = (cards: Card[], deckId: string): string[] =>
  [...new Set(selectCardsForDeck(cards, deckId).flatMap((card) => card.tags))].sort();
