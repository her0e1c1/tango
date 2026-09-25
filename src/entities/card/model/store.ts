import { getDecks } from "@/entities/deck/@x/card";
import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState, type SyncedQueryResult } from "@/shared/api";

import { cardIdSchema } from "./schema";
import type { Card, CardId, RemoteCard } from "./types";

interface CardState extends SyncState {
  remoteCards: Card[];
}

export const cardStore = createStore<CardState>()(
  persist((): CardState => ({ remoteCards: [], sync: {} }), syncPersistence("tango-card-sync"))
);

export function getCards(): Card[] {
  const { remoteCards } = cardStore.getState();
  const decks = getDecks();
  return remoteCards.filter((card) => decks.some((deck) => deck.id === card.deckId && deck.uid === card.uid));
}

export const findCardById = (id: CardId): Card | undefined => {
  const cardId = cardIdSchema.parse(id);
  return getCards().find((card) => card.id === cardId);
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};

export function applyCardSnapshot(scope: string, result: SyncedQueryResult<RemoteCard>) {
  const sync = { ...cardStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return cardStore.setState({
    remoteCards: result.values
      .filter((card) => card.deletedAt === null)
      .sort((left, right) => left.id.localeCompare(right.id)),
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
