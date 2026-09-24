import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import type { Deck, DeckId } from "./types";

export const deckStore = createStore<{ remoteDecks: Deck[] }>()(() => ({ remoteDecks: [] }));

export function getDecks(): Deck[] {
  return deckStore.getState().remoteDecks;
}

export const useDeck = (id: DeckId | undefined): Deck | undefined =>
  useStore(deckStore, (state) => state.remoteDecks.find((deck) => deck.id === id));

export const useDecks = (): Deck[] => useStore(deckStore, (state) => state.remoteDecks);

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};
