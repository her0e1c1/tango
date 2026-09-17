import { createStore } from "zustand/vanilla";

interface DeckCreatePageState {
  session: symbol | undefined;
  pending: boolean;
}

export const deckCreatePageStore = createStore<DeckCreatePageState>()(() => ({
  session: undefined,
  pending: false,
}));
