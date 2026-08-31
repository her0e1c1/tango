import * as React from "react";
import { useStore } from "zustand";

import { filterCardsByDeckId, filterTagsByDeckId } from "./rules";
import { cardStore } from "./store";
import type { Card, CardId } from "./types";

const subscribeLocalCardsHydration = (onStoreChange: () => void): (() => void) => {
  const stopHydrating = cardStore.persist.onHydrate(onStoreChange);
  const stopHydrated = cardStore.persist.onFinishHydration(onStoreChange);
  return () => {
    stopHydrating();
    stopHydrated();
  };
};

// Reads remote and local Cards as one ordered collection.
export const useCards = (): Card[] => {
  const state = useStore(cardStore);
  return [...state.remoteCards, ...state.localCards];
};

// Reads one Card by identifier across both persistence modes.
export const useCard = (id: CardId | undefined): Card | undefined =>
  useStore(
    cardStore,
    (state) => state.remoteCards.find((card) => card.id === id) ?? state.localCards.find((card) => card.id === id)
  );

// Local absence becomes authoritative only after persisted Cards have finished hydrating.
export const useLocalCardsHydrated = (): boolean =>
  React.useSyncExternalStore(subscribeLocalCardsHydration, cardStore.persist.hasHydrated, () => false);

// Reads the Cards and available tags owned by one Deck.
export const useCardsByDeckId = (deckId: string): { cards: Card[]; tags: string[] } => {
  const allCards = useCards();
  return {
    cards: filterCardsByDeckId(allCards, deckId),
    tags: filterTagsByDeckId(allCards, deckId),
  };
};
