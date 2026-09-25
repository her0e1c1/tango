import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState, type SyncedQueryResult } from "@/shared/api";

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

export function applyDeckSnapshot(scope: string, result: SyncedQueryResult<Deck | null>) {
  const sync = { ...deckStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return deckStore.setState({
    remoteDecks: result.values.filter((deck) => deck !== null).sort((left, right) => left.id.localeCompare(right.id)),
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
