import { createStore } from "zustand/vanilla";
import type { Card, CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";

interface CardListState {
  shownCard: Card | undefined;
  bulkCardIds: CardId[] | undefined;
  bulkDifficulty: Difficulty | null;
  bulkAttempted: boolean;
  deletionTarget: CardId | undefined;
  pendingDeletionName: string | undefined;
  mutationId: symbol | undefined;
}

export const cardListStore = createStore<CardListState>()(() => ({
  shownCard: undefined,
  bulkCardIds: undefined,
  deletionTarget: undefined,
  pendingDeletionName: undefined,
  bulkDifficulty: null,
  bulkAttempted: false,
  // Synchronous Zustand updates also lock gestures arriving before React renders.
  mutationId: undefined,
}));
