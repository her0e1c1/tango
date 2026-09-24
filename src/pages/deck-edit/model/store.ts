import { createStore } from "zustand/vanilla";

import type { Deck } from "@/entities/deck";

interface PendingTagSave {
  deckId: string;
  name: string;
  tags: string[];
  cards: { id: string; tags: string[] }[];
}

interface DeckEditPageState {
  tagChanges: { previous: string | undefined; name: string | undefined }[];
  editingTag: string | undefined;
  tagDeletion: string | undefined;
  submission: Promise<boolean> | undefined;
  pendingTagSave: PendingTagSave | undefined;
  deletionTarget: { deck: Deck; cardCount: number } | undefined;
  deletionId: symbol | undefined;
}

export const deckEditPageStore = createStore<DeckEditPageState>()(() => ({
  tagChanges: [],
  editingTag: undefined,
  tagDeletion: undefined,
  submission: undefined,
  pendingTagSave: undefined,
  deletionTarget: undefined,
  deletionId: undefined,
}));
