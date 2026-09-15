import { createStore } from "zustand/vanilla";
import type { Card, CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";
import type { ToastId } from "@/shared/ui/toast";

interface CardListState {
  owner: symbol | undefined;
  shownCard: Card | undefined;
  bulkCardIds: CardId[] | undefined;
  bulkDifficulty: Difficulty | null;
  bulkAttempted: boolean;
  deletionTarget: Card | undefined;
  mutationPending: boolean;
  errorToastId: ToastId | undefined;
}

export const cardListStore = createStore<CardListState>()(() => ({
  owner: undefined,
  shownCard: undefined,
  bulkCardIds: undefined,
  deletionTarget: undefined,
  errorToastId: undefined,
  bulkDifficulty: null,
  bulkAttempted: false,
  // Synchronous Zustand updates also lock gestures arriving before React renders.
  mutationPending: false,
}));
