import { createStore } from "zustand/vanilla";

import type { Card } from "./types";

interface CardState {
  remoteCards: Card[];
  localCards: Card[];
}

export const cardStore = createStore<CardState>()(() => ({ remoteCards: [], localCards: [] }));

export const replaceRemoteCards = (remoteCards: Card[]): void => {
  cardStore.setState({ remoteCards });
};

export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};
