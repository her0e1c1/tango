import { getDecks } from "@/entities/deck/@x/card";
import { createStore } from "zustand/vanilla";

import { cardIdSchema } from "./schema";
import type { Card, CardId, RemoteCard } from "./types";

interface CardState {
  cardsById: Record<CardId, RemoteCard>;
  invalidCardIds: readonly CardId[];
}

export const cardStore = createStore<CardState>(() => ({ cardsById: {}, invalidCardIds: [] }));

export function getCards(): Card[] {
  const { cardsById } = cardStore.getState();
  const decks = getDecks();
  return Object.values(cardsById)
    .filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid))
    .sort((left, right) => left.id.localeCompare(right.id));
}

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  const card = Object.hasOwn(cardStore.getState().cardsById, cardId)
    ? cardStore.getState().cardsById[cardId]
    : undefined;
  return card && getDecks().some((deck) => deck.id === card.deckId && deck.uid === card.uid) ? card : undefined;
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ cardsById: {}, invalidCardIds: [] });
};

export function applyCardChanges(
  cards: readonly RemoteCard[],
  {
    removedCardIds = [],
    invalidCardIds = [],
  }: { removedCardIds?: readonly CardId[]; invalidCardIds?: readonly CardId[] } = {}
): void {
  if (cards.length + removedCardIds.length + invalidCardIds.length === 0) return;
  const changedIds = new Set([...cards.map((card) => card.id), ...removedCardIds, ...invalidCardIds]);
  cardStore.setState(({ cardsById, invalidCardIds: previousInvalidIds }) => {
    const next = { ...cardsById };
    // Invalid changes hide the previous valid value without rewriting the saved document.
    for (const id of [...removedCardIds, ...invalidCardIds]) delete next[id];
    for (const card of cards) {
      if (card.deletedAt === null) next[card.id] = card;
      else delete next[card.id];
    }
    return {
      cardsById: next,
      invalidCardIds:
        invalidCardIds.length > 0 || previousInvalidIds.some((id) => changedIds.has(id))
          ? [...previousInvalidIds.filter((id) => !changedIds.has(id)), ...invalidCardIds].sort()
          : previousInvalidIds,
    };
  });
}
