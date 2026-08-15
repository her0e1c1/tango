import { mustFindCardById, type Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import { usePreferences } from "@/entities/preferences";
import { createStudyProgressFromCard, type StudyProgressEdit } from "@/entities/study-progress";
import { getStudySession, moveStudySession, removeStudySession, setStudySessionIndex } from "@/entities/study-session";

import React from "react";

import { buildStudyPatch } from "../model/swipe";

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

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Keeping the persistence and transition order inline makes the swipe invariant auditable.
  const swipe = async (direction: SwipeDirection): Promise<void> => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: The awaited write lets another event enter this closure.
    if (swipeState.current.inProgress) return;
    const session = getStudySession(deckId);
    if (session?.status !== "studying") return;

    const swipeAction = preferences.controls[direction];
    if (swipeAction === "DoNothing") return;
    if (swipeAction === "GoBack") {
      onSwipe?.(direction);
      removeStudySession(deckId);
      return;
    }

    const cardId = session.cardOrderIds[session.currentIndex];
    if (cardId == null) return;
    const card = mustFindCardById(cards, cardId);
    const patch = buildStudyPatch(createStudyProgressFromCard(card), swipeAction, Date.now());

    swipeState.current.inProgress = true;
    // The visible card advances only after persistence succeeds, so failed writes need no session rollback.
    const saved = await saveProgress(patch).then(
      () => true,
      () => false
    );
    swipeState.current.inProgress = false;
    if (!saved) return;

    const currentSession = getStudySession(deckId);
    // Position changes during the write own the newer card, while timestamp-only touches still allow advancement.
    if (
      currentSession?.status !== "studying" ||
      currentSession.currentIndex !== session.currentIndex ||
      currentSession.cardOrderIds[currentSession.currentIndex] !== cardId
    ) {
      return;
    }

    onSwipe?.(direction);
    if (preferences.appearance.hideBodyWhenCardChanged) onCardChanged?.();
    moveStudySession(deckId, swipeAction === "GoToPrevCard" ? "previous" : "next");
  };

  return {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    updateIndex: (currentIndex: number) => {
      if (getStudySession(deckId)?.status !== "studying") return;
      onCardChanged?.();
      setStudySessionIndex(deckId, currentIndex);
    },
  };
};
