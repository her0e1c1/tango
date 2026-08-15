import { useAuthUid } from "@/entities/auth";
import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { SwipeDirection } from "@/entities/preferences";
import { editStudyProgress } from "@/entities/study-progress";
import { removeStudySession, type StudySession, touchStudySession, useStudySession } from "@/entities/study-session";

import * as React from "react";

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
  const session = useStudySession(deckId);
  const cardId = session?.cardOrderIds[session.currentIndex];
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const status =
    card != null ? "ready" : session != null && cardId != null && cards.length === 0 ? "loading" : "unavailable";
  const exitingDeck = React.useRef<DeckId>(undefined);

  React.useEffect(() => {
    if (status !== "ready") return;
    touchStudySession(deckId);
  }, [deckId, status]);

  React.useEffect(() => {
    if (status === "ready") {
      exitingDeck.current = undefined;
      return;
    }
    if (status === "loading" || exitingDeck.current === deckId) return;

    // Invalid active progress must be removed before leaving so reopening the deck cannot repeat the same failure.
    exitingDeck.current = deckId;
    removeStudySession(deckId);
    onUnavailable();
  }, [deckId, onUnavailable, status]);

  React.useEffect(() => {
    if (
      status !== "ready" ||
      session == null ||
      !display.autoPlay ||
      display.preferences.study.cardInterval <= 0 ||
      session.currentIndex + 1 >= session.cardOrderIds.length
    ) {
      return;
    }
    const timeout = window.setTimeout(
      () => actions.updateIndex(session.currentIndex + 1),
      display.preferences.study.cardInterval * 1000
    );
    return () => window.clearTimeout(timeout);
  }, [actions, display.autoPlay, display.preferences.study.cardInterval, session, status]);
  const commands: StudyCommands = {
    swipeUp: actions.swipeUp,
    swipeDown: actions.swipeDown,
    swipeLeft: actions.swipeLeft,
    swipeRight: actions.swipeRight,
    toggleBackText: display.toggleBackText,
    toggleAutoPlay: display.toggleAutoPlay,
  };

  if (session == null || card == null) {
    const inactiveStatus = session != null && cardId != null && cards.length === 0 ? "loading" : "unavailable";
    return { status: inactiveStatus, ...commands };
  }

  return {
    status: "ready",
    ...commands,
    session,
    card,
    showHeader: display.preferences.appearance.showHeader && !display.showBackText,
    showBackText: display.showBackText,
    showController: display.preferences.study.cardInterval > 0,
    showSwipeButtonList: display.preferences.controls.showSwipeButtonList,
    autoPlay: display.autoPlay,
    updateIndex: actions.updateIndex,
    ...(feedback.lastSwipe !== undefined ? { swipeFeedback: feedback.lastSwipe } : {}),
  };
};
