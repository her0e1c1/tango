import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { type SwipeDirection, usePreferences } from "@/entities/preference";
import { editStudyProgress, type StudyProgressTarget } from "@/entities/study-progress";
import { getStudySession, moveStudySession, planStudySessionSwipe, removeStudySession } from "@/entities/study-session";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { showToast, type ToastTone } from "@/shared/ui/toast";

import * as React from "react";

const SWIPE_FEEDBACK_LABEL: Record<SwipeDirection, string> = {
  cardSwipeUp: "Swiped up",
  cardSwipeDown: "Swiped down",
  cardSwipeLeft: "Swiped left",
  cardSwipeRight: "Swiped right",
};

const SWIPE_FEEDBACK_DURATION_MS = 900;
const SWIPE_FEEDBACK_TONE = "neutral" satisfies ToastTone;

export interface SwipeState {
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
}

export interface StudyCompletion {
  cardCount: number;
}

interface UseSwipeOptions {
  onCardChanged: () => void;
  onCompleted: (completion: StudyCompletion) => void;
  target?: StudyProgressTarget;
}

export const useSwipe = (
  deckId: DeckId,
  cards: readonly Card[],
  { onCardChanged, onCompleted, target }: UseSwipeOptions
): SwipeState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const isMounted = useMountedGuard();
  const swipeState = React.useRef<{ inProgress: boolean }>({ inProgress: false });

  const showSwipeToast = (direction: SwipeDirection): void => {
    if (!preferences.appearance.showSwipeFeedback) return;
    showToast({
      message: SWIPE_FEEDBACK_LABEL[direction],
      tone: SWIPE_FEEDBACK_TONE,
      durationMs: SWIPE_FEEDBACK_DURATION_MS,
      dismissible: false,
    });
  };

  const updateVisibleSession = (direction: SwipeDirection, completesSession: boolean, cardCount: number): void => {
    // Session persistence still completes after navigation, but route-owned feedback and UI callbacks must not leak.
    if (!isMounted()) return;
    showSwipeToast(direction);
    if (completesSession) {
      onCompleted({ cardCount });
      return;
    }
    if (preferences.appearance.hideBodyWhenCardChanged) onCardChanged();
  };

  const swipe = async (direction: SwipeDirection): Promise<void> => {
    // A pending write yields to later input events, so only one swipe may plan and persist at a time.
    // biome-ignore lint/suspicious/noUnnecessaryConditions: later input events observe mutations through this React ref.
    if (swipeState.current.inProgress) return;

    const swipeAction = preferences.controls[direction];
    const swipePlan = planStudySessionSwipe(getStudySession(deckId), cards, swipeAction, Date.now());
    if (swipePlan.effect === "none") return;
    if (swipePlan.effect === "exit") {
      removeStudySession(deckId);
      showSwipeToast(direction);
      return;
    }

    // Completion is derived from the pre-write snapshot because a successful boundary move removes the session.
    const completesSession =
      swipePlan.effect === "next" && swipePlan.session.currentIndex === swipePlan.session.cardOrderIds.length - 1;
    const cardCount = swipePlan.session.cardOrderIds.length;

    swipeState.current.inProgress = true;
    // The visible card advances only after persistence succeeds, so failed writes need no session rollback.
    const saved = await editStudyProgress(uid, swipePlan.progress, target).then(
      () => true,
      () => false
    );
    swipeState.current.inProgress = false;
    if (!saved) return;

    if (!moveStudySession(swipePlan.session, swipePlan.effect)) return;

    updateVisibleSession(direction, completesSession, cardCount);
  };

  return {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
  };
};
