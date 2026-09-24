import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckEditPageState {
  submission: Promise<boolean> | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionId: symbol | undefined;
}

export const deckEditPageStore = createStore<DeckEditPageState>()(() => ({
  submission: undefined,
  deletionTarget: undefined,
  deletionId: undefined,
}));
