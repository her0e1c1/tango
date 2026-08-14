import { createStore } from "zustand/vanilla";

import type { Card } from "./types";

interface CardState {
  cards: Card[];
}

export const cardStore = createStore<CardState>()(() => ({ cards: [] }));

export const replaceCards = (cards: Card[]): void => {
  cardStore.setState({ cards });
};

export const clearCards = (): void => {
  cardStore.setState({ cards: [] });
};
