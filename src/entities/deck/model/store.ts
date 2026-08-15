import { createStore } from "zustand/vanilla";

import type { Deck } from "./types";

interface DeckState {
  remoteDecks: Deck[];
  localDecks: Deck[];
}

export const deckStore = createStore<DeckState>()(() => ({ remoteDecks: [], localDecks: [] }));

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};
