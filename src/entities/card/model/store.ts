import { createStore } from "zustand/vanilla";

import type { Card, RemoteCard } from "./types";

interface CardState {
  remoteCards: Card[];
}

export const cardStore = createStore<CardState>(() => ({ remoteCards: [] }));

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};

export function applyCardSnapshot(cards: RemoteCard[]) {
  cardStore.setState({
    remoteCards: cards.filter((card) => card.deletedAt === null).sort((left, right) => left.id.localeCompare(right.id)),
  });
}
