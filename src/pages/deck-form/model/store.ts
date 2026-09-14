import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckFormPageState {
  owner: symbol | undefined;
  submission: Promise<void> | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionPending: boolean;
}

export const deckFormPageStore = createStore<DeckFormPageState>()(() => ({
  owner: undefined,
  submission: undefined,
  deletionTarget: undefined,
  deletionPending: false,
}));
