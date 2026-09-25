import { createStore } from "zustand/vanilla";

import type { Deck } from "./types";

export const deckStore = createStore<{ remoteDecks: Deck[] }>()(() => ({ remoteDecks: [] }));

export function getDecks(): Deck[] {
  return deckStore.getState().remoteDecks;
}

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};
