import { createStore } from "zustand/vanilla";
import type { Card, CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";

export type CardListSortOrder = "standard" | "newest";

interface BulkDifficultyState {
  cardIds: CardId[];
  difficulty: Difficulty | null;
  attempted: boolean;
}

export interface CardListState {
  sortOrder: CardListSortOrder;
  shownCard: Pick<Card, "backText" | "tags"> | undefined;
  bulk: BulkDifficultyState | undefined;
  deletionTarget: Pick<Card, "id" | "frontText"> | undefined;
  mutationId: symbol | undefined;
}

export const cardListStore = createStore<CardListState>()(() => ({
  sortOrder: "standard",
  shownCard: undefined,
  bulk: undefined,
  deletionTarget: undefined,
  // Synchronous Zustand updates also lock gestures arriving before React renders.
  mutationId: undefined,
}));
