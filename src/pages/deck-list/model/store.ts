import { createStore } from "zustand/vanilla";

export type DeckListBootstrapStatus = "idle" | "checking" | "error" | "done";

interface DeckListState {
  bootstrapStatus: DeckListBootstrapStatus;
  pendingContinue: { uid: string; deckId: string } | undefined;
}

export const deckListStore = createStore<DeckListState>()(() => ({
  bootstrapStatus: "idle",
  pendingContinue: undefined,
}));
