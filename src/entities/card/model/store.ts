import { getDecks } from "@/entities/deck/@x/card";
import { createStore } from "zustand/vanilla";

import { cardIdSchema } from "./schema";
import type { Card, CardId, RemoteCard } from "./types";

interface CardState {
  cardsById: Record<CardId, RemoteCard>;
  cardIdsByDeckId: ReadonlyMap<string, readonly CardId[]>;
  invalidCardIds: readonly CardId[];
}

export const cardStore = createStore<CardState>(() => ({
  cardsById: {},
  cardIdsByDeckId: new Map(),
  invalidCardIds: [],
}));

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
  cardStore.setState({ cardsById: {}, cardIdsByDeckId: new Map(), invalidCardIds: [] });
};

function updateDeckIndex(
  cardsById: CardState["cardsById"],
  next: CardState["cardsById"],
  cardIdsByDeckId: CardState["cardIdsByDeckId"],
  changedIds: ReadonlySet<CardId>
): CardState["cardIdsByDeckId"] {
  const changedDecks = new Map<string, Set<CardId>>();
  for (const id of changedIds) {
    const previous = Object.hasOwn(cardsById, id) ? cardsById[id] : undefined;
    const current = Object.hasOwn(next, id) ? next[id] : undefined;
    // Content and FSRS edits preserve membership; only additions, removals and moves change the index.
    if (previous?.deckId === current?.deckId) continue;
    for (const card of [previous, current]) {
      if (card && !changedDecks.has(card.deckId))
        changedDecks.set(card.deckId, new Set(cardIdsByDeckId.get(card.deckId)));
    }
    if (previous) changedDecks.get(previous.deckId)?.delete(id);
    if (current) changedDecks.get(current.deckId)?.add(id);
  }
  if (changedDecks.size === 0) return cardIdsByDeckId;
  const index = new Map(cardIdsByDeckId);
  for (const [deckId, ids] of changedDecks) {
    if (ids.size > 0)
      index.set(
        deckId,
        [...ids].sort((left, right) => left.localeCompare(right))
      );
    else index.delete(deckId);
  }
  return index;
}

export function applyCardChanges(
  cards: readonly RemoteCard[],
  {
    removedCardIds = [],
    invalidCardIds = [],
  }: { removedCardIds?: readonly CardId[]; invalidCardIds?: readonly CardId[] } = {}
): void {
  if (cards.length + removedCardIds.length + invalidCardIds.length === 0) return;
  const changedIds = new Set([...cards.map((card) => card.id), ...removedCardIds, ...invalidCardIds]);
  cardStore.setState(({ cardsById, cardIdsByDeckId, invalidCardIds: previousInvalidIds }) => {
    const next = { ...cardsById };
    // Invalid changes hide the previous valid value without rewriting the saved document.
    for (const id of [...removedCardIds, ...invalidCardIds]) delete next[id];
    for (const card of cards) {
      if (card.deletedAt === null) next[card.id] = card;
      else delete next[card.id];
    }
    return {
      cardsById: next,
      cardIdsByDeckId: updateDeckIndex(cardsById, next, cardIdsByDeckId, changedIds),
      invalidCardIds:
        invalidCardIds.length > 0 || previousInvalidIds.some((id) => changedIds.has(id))
          ? [...previousInvalidIds.filter((id) => !changedIds.has(id)), ...invalidCardIds].sort()
          : previousInvalidIds,
    };
  });
}
