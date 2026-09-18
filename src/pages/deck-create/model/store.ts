import { createStore } from "zustand/vanilla";

interface DeckCreatePageState {
  mutationId: symbol | undefined;
}

export const deckCreatePageStore = createStore<DeckCreatePageState>()(() => ({
  mutationId: undefined,
}));
