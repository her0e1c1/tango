import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState } from "@/shared/api";

import type { Deck } from "./types";

interface DeckState extends SyncState {
  remoteDecks: Deck[];
}

export const deckStore = createStore<DeckState>()(
  persist((): DeckState => ({ remoteDecks: [], sync: {} }), syncPersistence("tango-deck-sync"))
);

export function getDecks(): Deck[] {
  return deckStore.getState().remoteDecks;
}

export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};
