import { createStore } from "zustand/vanilla";

import type { Deck } from "./types";

interface DeckState {
  remoteDecks: Deck[];
}

export const deckStore = createStore<DeckState>(() => ({ remoteDecks: [] }));

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export function applyDeckSnapshot(decks: (Deck | null)[]) {
  deckStore.setState({
    remoteDecks: decks.filter((deck) => deck !== null).sort((left, right) => left.id.localeCompare(right.id)),
  });
}
