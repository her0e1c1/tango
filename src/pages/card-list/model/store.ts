import { createStore } from "zustand/vanilla";
import type { Card } from "@/entities/card";

export type CardListSortOrder = "standard" | "newest";

export interface CardListState {
  sortOrder: CardListSortOrder;
  shownCard: Pick<Card, "backText" | "tags"> | undefined;
  deletionTarget: Pick<Card, "id" | "frontText"> | undefined;
  mutationId: symbol | undefined;
}

export const cardListStore = createStore<CardListState>()(() => ({
  sortOrder: "standard",
  shownCard: undefined,
  deletionTarget: undefined,
  // Synchronous Zustand updates also lock gestures arriving before React renders.
  mutationId: undefined,
}));
