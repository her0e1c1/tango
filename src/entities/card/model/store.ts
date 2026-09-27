import { getDecks } from "@/entities/deck/@x/card";
import { createStore } from "zustand/vanilla";

import { cardIdSchema } from "./schema";
import type { Card, CardId, RemoteCard } from "./types";

interface CardState {
  cardsById: Record<CardId, RemoteCard>;
}

export const cardStore = createStore<CardState>(() => ({ cardsById: {} }));

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
  cardStore.setState({ cardsById: {} });
};

export function applyCardChanges(cards: readonly RemoteCard[]): void {
  if (cards.length === 0) return;
  cardStore.setState(({ cardsById }) => {
    const next = { ...cardsById };
    for (const card of cards) {
      if (card.deletedAt === null) next[card.id] = card;
      else delete next[card.id];
    }
    return { cardsById: next };
  });
}

export function applyCardSnapshot(cards: readonly RemoteCard[]): void {
  cardStore.setState({
    cardsById: Object.fromEntries(cards.filter((card) => card.deletedAt === null).map((card) => [card.id, card])),
  });
}
