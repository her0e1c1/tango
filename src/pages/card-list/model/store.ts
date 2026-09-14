import { createStore } from "zustand/vanilla";
import type { Card, CardId } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";
import type { ToastId } from "@/shared/ui/toast";

interface CardListState {
  active: boolean;
  shownCard: Card | undefined;
  bulkCardIds: CardId[] | undefined;
  bulkDifficulty: Difficulty | null;
  bulkAttempted: boolean;
  deletionTarget: Card | undefined;
  mutationPending: boolean;
  errorToastId: ToastId | undefined;
}

// Each mounted Page owns its store so an old write cannot unlock or notify a new Page.
export function createCardListStore() {
  return createStore<CardListState>()(() => ({
    shownCard: undefined,
    bulkCardIds: undefined,
    deletionTarget: undefined,
    errorToastId: undefined,
    active: true,
    bulkDifficulty: null,
    bulkAttempted: false,
    // Synchronous Zustand updates also lock gestures arriving before React renders.
    mutationPending: false,
  }));
}

export type CardListStore = ReturnType<typeof createCardListStore>;
