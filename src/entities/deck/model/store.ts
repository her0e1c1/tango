import { createStore } from "zustand/vanilla";
import type { SyncedQueryResult } from "@/shared/api";

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

export const replaceRemoteDecks = (remoteDecks: Deck[]): void => {
  deckStore.setState({ remoteDecks });
};

export function applyDeckSnapshot(result: SyncedQueryResult<Deck | null>) {
  deckStore.setState({
    remoteDecks: result.values.filter((deck) => deck !== null).sort((left, right) => left.id.localeCompare(right.id)),
  });
}
