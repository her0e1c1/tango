import type { Card } from "./types";

export const filterCardsByDeckId = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterCardsByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();

export type CardsById = Readonly<Record<string, Card | undefined>>;

export const toCardsById = (cards: readonly Card[]): CardsById =>
  Object.fromEntries(cards.map((card) => [card.id, card]));
