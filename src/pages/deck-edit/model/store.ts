import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckEditPageState {
  tagMutation: symbol | undefined;
  tagError: "required" | "duplicate" | undefined;
  editingTag: string | undefined;
  tagDeletion: string | undefined;
  submission: Promise<boolean> | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionId: symbol | undefined;
}

export const deckEditPageStore = createStore<DeckEditPageState>()(() => ({
  tagMutation: undefined,
  tagError: undefined,
  editingTag: undefined,
  tagDeletion: undefined,
  submission: undefined,
  deletionTarget: undefined,
  deletionId: undefined,
}));
