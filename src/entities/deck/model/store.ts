import { createStore } from "zustand/vanilla";

import type { Deck } from "./schema";

interface DeckState {
  decks: Deck[];
}

export const deckStore = createStore<DeckState>()(() => ({ decks: [] }));

export const replaceDecks = (decks: Deck[]): void => {
  deckStore.setState({ decks });
};

export const clearDecks = (): void => {
  deckStore.setState({ decks: [] });
};
