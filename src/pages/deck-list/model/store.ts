import { createStore } from "zustand/vanilla";

export type DeckListBootstrapStatus = "idle" | "checking" | "error" | "done";

interface DeckListState {
  bootstrapStatus: DeckListBootstrapStatus;
}

export const deckListStore = createStore<DeckListState>()(() => ({
  bootstrapStatus: "idle",
}));
