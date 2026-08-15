import type { Card, CardId } from "./types";

export const filterCardsByDeckId = (cards: Card[], deckId: string): Card[] =>
  cards.filter((card) => card.deckId === deckId);

export const filterTagsByDeckId = (cards: Card[], deckId: string): string[] =>
  [...new Set(filterCardsByDeckId(cards, deckId).flatMap((card) => card.tags))].sort();

export const mustFindCardById = (cards: readonly Card[], id: CardId): Card => {
  const card = cards.find((candidate) => candidate.id === id);

  if (card == null) throw new Error(`Card not found: ${id}`);

  return card;
};
