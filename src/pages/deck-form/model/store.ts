import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckFormPageState {
  owner: symbol | undefined;
  submissionPending: boolean;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionPending: boolean;
}

export const deckFormPageStore = createStore<DeckFormPageState>()(() => ({
  owner: undefined,
  submissionPending: false,
  deletionTarget: undefined,
  deletionPending: false,
}));
