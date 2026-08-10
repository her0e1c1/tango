import type { Card } from "./card";

export const selectCardsForDeck = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);
