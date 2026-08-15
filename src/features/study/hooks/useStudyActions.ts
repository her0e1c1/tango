import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import { usePreferences } from "@/entities/preferences";
import type { StudyProgressEdit } from "@/entities/study-progress";
import {
  getStudySession,
  isStudySessionPositionUnchanged,
  moveStudySession,
  planStudySessionSwipe,
  removeStudySession,
  setStudySessionIndex,
} from "@/entities/study-session";

import React from "react";

export interface StudyActions {
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  updateIndex: (currentIndex: number) => void;
}

interface UseStudyActionsOptions {
  cards: readonly Card[];
  saveProgress: (progress: StudyProgressEdit) => Promise<void>;
  onSwipe?: ((direction: SwipeDirection) => void) | undefined;
  onCardChanged?: (() => void) | undefined;
}

export const useStudyActions = (
  deckId: DeckId,
  { cards, saveProgress, onSwipe, onCardChanged }: UseStudyActionsOptions
): StudyActions => {
  const preferences = usePreferences();
  const swipeState = React.useRef<{ inProgress: boolean }>({ inProgress: false });

  const swipe = async (direction: SwipeDirection): Promise<void> => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: The awaited write lets another event enter this closure.
    if (swipeState.current.inProgress) return;

    const swipeAction = preferences.controls[direction];
    const swipePlan = planStudySessionSwipe(getStudySession(deckId), cards, swipeAction, Date.now());
    if (swipePlan.effect === "none") return;
    if (swipePlan.effect === "exit") {
      onSwipe?.(direction);
      removeStudySession(deckId);
      return;
    }

    swipeState.current.inProgress = true;
    // The visible card advances only after persistence succeeds, so failed writes need no session rollback.
    const saved = await saveProgress(swipePlan.progress).then(
      () => true,
      () => false
    );
    swipeState.current.inProgress = false;
    if (!saved) return;

    const currentSession = getStudySession(deckId);
    // Position changes during the write own the newer card, while timestamp-only touches still allow advancement.
    if (!isStudySessionPositionUnchanged(swipePlan.session, currentSession)) return;

    onSwipe?.(direction);
    if (preferences.appearance.hideBodyWhenCardChanged) onCardChanged?.();
    moveStudySession(deckId, swipePlan.effect);
  };

  return {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    updateIndex: (currentIndex: number) => {
      if (getStudySession(deckId) == null) return;
      onCardChanged?.();
      setStudySessionIndex(deckId, currentIndex);
    },
  };
};
