import { createStore } from "zustand/vanilla";

import type { Deck } from "./types";

interface DeckState {
  remoteDecks: Deck[];
}

export const deckStore = createStore<DeckState>(() => ({ remoteDecks: [] }));

export function getDecks(): Deck[] {
  return deckStore.getState().remoteDecks;
}

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export function setRemoteDecks(decks: Deck[]) {
  deckStore.setState({
    remoteDecks: decks.toSorted((left, right) => left.id.localeCompare(right.id)),
  });
}
