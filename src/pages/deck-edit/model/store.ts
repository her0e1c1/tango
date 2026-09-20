import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckEditPageState {
  submission: Promise<void> | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionPending: boolean;
}

export const deckEditPageStore = createStore<DeckEditPageState>()(() => ({
  submission: undefined,
  deletionTarget: undefined,
  deletionPending: false,
}));
