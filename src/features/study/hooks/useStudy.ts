import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import { editStudyProgress } from "@/entities/study-progress";

import * as React from "react";

import { useActiveStudySession, useStudySessionLifecycle } from "./useActiveStudySession";
import { useStudyActions } from "./useStudyActions";
import { useStudyDisplayState } from "./useStudyDisplayState";
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
    | { status: "loading" | "unavailable" }
    | {
        status: "ready";
        card: Card;
        showHeader: boolean;
        showBackText: boolean;
        showController: boolean;
        showSwipeButtonList: boolean;
        swipeFeedback?: SwipeDirection;
        autoPlay: boolean;
        cardInterval: number;
        index: number;
        numberOfCards: number;
        updateIndex: (index: number) => void;
      }
  );

export const useStudy = (deckId: DeckId, cards: readonly Card[], onUnavailable: () => void): StudyState => {
  const uid = useAuthUid();
  const display = useStudyDisplayState();
  const feedback = useSwipeFeedback(display.preferences.appearance.showSwipeFeedback);
  const saveProgress = React.useCallback(
    (progress: Parameters<typeof editStudyProgress>[1]) => editStudyProgress(uid, progress),
    [uid]
  );
  const actions = useStudyActions(deckId, {
    cards,
    saveProgress,
    onSwipe: feedback.showSwipe,
    onCardChanged: display.hideBackText,
  });
  const session = useActiveStudySession(deckId, cards);
  useStudySessionLifecycle({ deckId, session, onUnavailable });

  React.useEffect(() => {
    if (
      session.status !== "ready" ||
      !display.autoPlay ||
      display.preferences.study.cardInterval <= 0 ||
      session.index + 1 >= session.numberOfCards
    ) {
      return;
    }
    const timeout = window.setTimeout(
      () => actions.updateIndex(session.index + 1),
      display.preferences.study.cardInterval * 1000
    );
    return () => window.clearTimeout(timeout);
  }, [actions, display.autoPlay, display.preferences.study.cardInterval, session]);
  const commands: StudyCommands = {
    swipeUp: actions.swipeUp,
    swipeDown: actions.swipeDown,
    swipeLeft: actions.swipeLeft,
    swipeRight: actions.swipeRight,
    toggleBackText: display.toggleBackText,
    toggleAutoPlay: display.toggleAutoPlay,
  };

  if (session.status !== "ready") return { ...session, ...commands };

  return {
    status: "ready",
    ...commands,
    card: session.card,
    showHeader: display.preferences.appearance.showHeader && !display.showBackText,
    showBackText: display.showBackText,
    showController: display.preferences.study.cardInterval > 0,
    showSwipeButtonList: display.preferences.controls.showSwipeButtonList,
    autoPlay: display.autoPlay,
    cardInterval: display.preferences.study.cardInterval,
    index: session.index,
    numberOfCards: session.numberOfCards,
    updateIndex: actions.updateIndex,
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
};
