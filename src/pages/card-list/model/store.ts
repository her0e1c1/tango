import { createStore } from "zustand/vanilla";
import type { Card, CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";

export type CardListSortOrder = "standard" | "newest";

interface CardListState {
  sortOrder: CardListSortOrder;
  shownCard: Card | undefined;
  bulkCardIds: CardId[] | undefined;
  bulkDifficulty: Difficulty | null;
  bulkAttempted: boolean;
  deletionTarget: Pick<Card, "id" | "frontText"> | undefined;
  mutationId: symbol | undefined;
}

export const cardListStore = createStore<CardListState>()(() => ({
  sortOrder: "standard",
  shownCard: undefined,
  bulkCardIds: undefined,
  deletionTarget: undefined,
  bulkDifficulty: null,
  bulkAttempted: false,
  // Synchronous Zustand updates also lock gestures arriving before React renders.
  mutationId: undefined,
}));
