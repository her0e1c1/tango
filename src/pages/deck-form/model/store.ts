import { createStore, type StoreApi } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckFormPageState {
  submissionPending: boolean;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionPending: boolean;
}

export type DeckFormPageStore = StoreApi<DeckFormPageState>;

export function createDeckFormPageStore(): DeckFormPageStore {
  // Each editor visit owns its locks; an old completion must never unlock a newer editor.
  return createStore<DeckFormPageState>()(() => ({
    submissionPending: false,
    deletionTarget: undefined,
    deletionPending: false,
  }));
}
