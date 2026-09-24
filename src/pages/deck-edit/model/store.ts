import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface DeckEditPageState {
  draftTags: string[] | undefined;
  tagChanges: { previous: string | undefined; name: string | undefined }[];
  tagError: "required" | "duplicate" | undefined;
  editingTag: string | undefined;
  tagDeletion: string | undefined;
  submission: Promise<boolean> | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionId: symbol | undefined;
}

export const deckEditPageStore = createStore<DeckEditPageState>()(() => ({
  draftTags: undefined,
  tagChanges: [],
  tagError: undefined,
  editingTag: undefined,
  tagDeletion: undefined,
  submission: undefined,
  deletionTarget: undefined,
  deletionId: undefined,
}));
