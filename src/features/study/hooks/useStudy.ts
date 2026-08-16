import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { type SwipeDirection, usePreferences } from "@/entities/preferences";
import { editStudyProgress } from "@/entities/study-progress";
import {
  calculateStudySessionIndex,
  getStudySession,
  moveStudySession,
  planStudySessionSwipe,
  removeStudySession,
  resolveStudySession,
  setStudySessionIndex,
  type StudySession,
  touchStudySession,
  useStudySession,
} from "@/entities/study-session";

import * as React from "react";

import { useSwipeFeedback } from "./useSwipeFeedback";

interface StudyCommands {
  swipeUp: () => Promise<void>;
  swipeDown: () => Promise<void>;
  swipeLeft: () => Promise<void>;
  swipeRight: () => Promise<void>;
  toggleBackText: () => void;
  toggleAutoPlay: () => void;
}

export type StudyState = StudyCommands &
  (
    | { status: "preparing" | "invalid" }
    | {
        status: "studying";
        session: StudySession;
        card: Card;
        showHeader: boolean;
        showBackText: boolean;
        showController: boolean;
        showSwipeButtonList: boolean;
        swipeFeedback?: SwipeDirection;
        autoPlay: boolean;
        updateIndex: (index: number) => void;
      }
  );

export const useStudy = (deckId: DeckId, cards: readonly Card[], onInvalid: () => void): StudyState => {
  const uid = useAuthUid();
  const preferences = usePreferences();
  const [showBackText, setShowBackText] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(preferences.study.defaultAutoPlay);
  const hideBackText = () => setShowBackText(false);
  const toggleBackText = () => setShowBackText((visible) => !visible);
  const toggleAutoPlay = () => setAutoPlay((playing) => !playing);
  const feedback = useSwipeFeedback(preferences.appearance.showSwipeFeedback);
  const saveProgress = (progress: Parameters<typeof editStudyProgress>[1]) => editStudyProgress(uid, progress);
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
    const saved = await saveProgress(swipePlan.progress).then(
      () => true,
      () => false
    );
    swipeState.current.inProgress = false;
    if (!saved) return;

    if (!moveStudySession(swipePlan.session, swipePlan.effect)) return;

    feedback.showSwipe(direction);
    if (preferences.appearance.hideBodyWhenCardChanged) hideBackText();
  };
  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };
  const session = useStudySession(deckId);
  const resolvedSession = resolveStudySession(session, cards);
  const exitingDeck = React.useRef<DeckId>(undefined);

  React.useEffect(() => {
    if (resolvedSession.status !== "studying") return;
    touchStudySession(deckId);
  }, [deckId, resolvedSession.status]);

  React.useEffect(() => {
    if (resolvedSession.status === "studying") {
      exitingDeck.current = undefined;
      return;
    }
    if (resolvedSession.status === "preparing" || exitingDeck.current === deckId) return;

    // Invalid active progress must be removed before leaving so reopening the deck cannot repeat the same failure.
    exitingDeck.current = deckId;
    removeStudySession(deckId);
    onInvalid();
  }, [deckId, onInvalid, resolvedSession.status]);

  React.useEffect(() => {
    const nextIndex = session == null ? undefined : calculateStudySessionIndex(session, "next");
    if (
      resolvedSession.status !== "studying" ||
      !autoPlay ||
      preferences.study.cardInterval <= 0 ||
      nextIndex === undefined
    ) {
      return;
    }
    const timeout = window.setTimeout(() => {
      if (setStudySessionIndex(deckId, nextIndex)) setShowBackText(false);
    }, preferences.study.cardInterval * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlay, deckId, preferences.study.cardInterval, resolvedSession.status, session]);
  const commands: StudyCommands = {
    swipeUp: () => swipe("cardSwipeUp"),
    swipeDown: () => swipe("cardSwipeDown"),
    swipeLeft: () => swipe("cardSwipeLeft"),
    swipeRight: () => swipe("cardSwipeRight"),
    toggleBackText,
    toggleAutoPlay,
  };

  if (resolvedSession.status !== "studying") return { status: resolvedSession.status, ...commands };

  return {
    status: "studying",
    ...commands,
    session: resolvedSession.session,
    card: resolvedSession.card,
    showHeader: preferences.appearance.showHeader && !showBackText,
    showBackText,
    showController: preferences.study.cardInterval > 0,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    autoPlay,
    updateIndex,
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
};
