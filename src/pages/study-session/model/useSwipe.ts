import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { type SwipeDirection, usePreferences } from "@/entities/preference";
import { editStudyProgress, type StudyProgressEdit } from "@/entities/study-progress";
import { getStudySession, moveStudySession, planStudySessionSwipe, removeStudySession } from "@/entities/study-session";

import * as React from "react";

import { useSwipeFeedback } from "./useSwipeFeedback";

export interface SwipeState {
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  swipeFeedback?: SwipeDirection;
}

const persistStudyProgress = (
  uid: string,
  progress: StudyProgressEdit,
  verifiedRemoteCardId: Card["id"] | undefined
): Promise<void> =>
  verifiedRemoteCardId === progress.cardId
    ? editStudyProgress(uid, progress, { persistence: "remote", cardId: verifiedRemoteCardId })
    : editStudyProgress(uid, progress);

export const useSwipe = (
  deckId: DeckId,
  cards: readonly Card[],
  onCardChanged: () => void,
  verifiedRemoteCardId?: Card["id"]
): SwipeState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const feedback = useSwipeFeedback(preferences.appearance.showSwipeFeedback);
  const swipeState = React.useRef<{ inProgress: boolean }>({ inProgress: false });

  const swipe = async (direction: SwipeDirection): Promise<void> => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: The awaited write lets another event enter this closure.
    if (swipeState.current.inProgress) return;

    const swipeAction = preferences.controls[direction];
    const swipePlan = planStudySessionSwipe(getStudySession(deckId), cards, swipeAction, Date.now());
    if (swipePlan.effect === "none") return;
    if (swipePlan.effect === "exit") {
      feedback.showSwipe(direction);
      removeStudySession(deckId);
      return;
    }

    swipeState.current.inProgress = true;
    // The visible card advances only after persistence succeeds, so failed writes need no session rollback.
    const saveProgress = persistStudyProgress(uid, swipePlan.progress, verifiedRemoteCardId);
    const saved = await saveProgress.then(
      () => true,
      () => false
    );
    swipeState.current.inProgress = false;
    if (!saved) return;

    if (!moveStudySession(swipePlan.session, swipePlan.effect)) return;

    feedback.showSwipe(direction);
    if (preferences.appearance.hideBodyWhenCardChanged) onCardChanged();
  };

  return {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
};
