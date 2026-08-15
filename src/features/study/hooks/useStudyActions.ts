import { mustFindCardById, type Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeAction, SwipeDirection } from "@/entities/preferences";
import { usePreferences } from "@/entities/preferences";
import { createStudyProgressFromCard, type StudyProgressEdit } from "@/entities/study-progress";
import { getStudySession, moveStudySession, removeStudySession, setStudySessionIndex } from "@/entities/study-session";

import React from "react";

import { buildStudyPatch } from "../model/swipe";

const handleNavigationOnlySwipe = (
  deckId: DeckId,
  direction: SwipeDirection,
  swipeAction: SwipeAction,
  onSwipe: ((direction: SwipeDirection) => void) | undefined
): boolean => {
  if (swipeAction === "DoNothing") return true;
  if (swipeAction !== "GoBack") return false;

  onSwipe?.(direction);
  removeStudySession(deckId);
  return true;
};

interface PersistedSwipe {
  deckId: DeckId;
  session: NonNullable<ReturnType<typeof getStudySession>>;
  direction: SwipeDirection;
  swipeAction: SwipeAction;
  hideBackText: boolean;
  onSwipe: ((direction: SwipeDirection) => void) | undefined;
  onCardChanged: (() => void) | undefined;
}

const hasSameStudyPosition = (
  expected: NonNullable<ReturnType<typeof getStudySession>>,
  current: ReturnType<typeof getStudySession>
): boolean =>
  current != null &&
  current.currentIndex === expected.currentIndex &&
  current.cardOrderIds.length === expected.cardOrderIds.length &&
  current.cardOrderIds.every((cardId, index) => cardId === expected.cardOrderIds[index]);

const applyPersistedSwipe = ({
  deckId,
  session,
  direction,
  swipeAction,
  hideBackText,
  onSwipe,
  onCardChanged,
}: PersistedSwipe): void => {
  // Position changes during the write own the newer card, while timestamp-only touches must still allow advancement.
  if (!hasSameStudyPosition(session, getStudySession(deckId))) return;
  onSwipe?.(direction);
  if (hideBackText) onCardChanged?.();
  moveStudySession(deckId, swipeAction === "GoToPrevCard" ? "previous" : "next");
};

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
    const session = getStudySession(deckId);
    if (session == null) return;

    const swipeAction = preferences.controls[direction];
    if (handleNavigationOnlySwipe(deckId, direction, swipeAction, onSwipe)) return;

    const cardId = session.cardOrderIds[session.currentIndex];
    if (cardId == null) return;
    const card = mustFindCardById(cards, cardId);
    const patch = buildStudyPatch(createStudyProgressFromCard(card), swipeAction, Date.now());

    swipeState.current.inProgress = true;
    try {
      // The visible card advances only after persistence succeeds, so failed writes need no session rollback.
      await saveProgress(patch);
      applyPersistedSwipe({
        deckId,
        session,
        direction,
        swipeAction,
        hideBackText: preferences.appearance.hideBodyWhenCardChanged,
        onSwipe,
        onCardChanged,
      });
    } catch {
      // Keep the current card visible so the user can retry the failed rating.
    } finally {
      swipeState.current.inProgress = false;
    }
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
