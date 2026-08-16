import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { type SwipeDirection, usePreferences } from "@/entities/preferences";
import {
  planStudySessionAutoPlay,
  removeStudySession,
  resolveStudySession,
  setStudySessionIndex,
  type StudySession,
  touchStudySession,
  useStudySession,
} from "@/entities/study-session";

import * as React from "react";

import { useSwipe } from "../model/useSwipe";

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
  const preferences = usePreferences();
  const [showBackText, setShowBackText] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(preferences.study.defaultAutoPlay);
  const hideBackText = () => setShowBackText(false);
  const toggleBackText = () => setShowBackText((visible) => !visible);
  const toggleAutoPlay = () => setAutoPlay((playing) => !playing);
  const swipe = useSwipe(deckId, cards, hideBackText);
  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };
  const session = useStudySession(deckId);
  const resolvedSession = resolveStudySession(session, cards);
  const autoPlayPlan = planStudySessionAutoPlay(resolvedSession, {
    enabled: autoPlay,
    intervalSeconds: preferences.study.cardInterval,
  });
  const autoPlayNextIndex = autoPlayPlan?.nextIndex;
  const autoPlayIntervalSeconds = autoPlayPlan?.intervalSeconds;
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
    if (autoPlayNextIndex === undefined || autoPlayIntervalSeconds === undefined) return;
    const timeout = window.setTimeout(() => {
      if (setStudySessionIndex(deckId, autoPlayNextIndex)) setShowBackText(false);
    }, autoPlayIntervalSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlayIntervalSeconds, autoPlayNextIndex, deckId]);
  const commands: StudyCommands = {
    swipeUp: swipe.swipeUp,
    swipeDown: swipe.swipeDown,
    swipeLeft: swipe.swipeLeft,
    swipeRight: swipe.swipeRight,
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
    ...(swipe.swipeFeedback !== undefined ? { swipeFeedback: swipe.swipeFeedback } : {}),
  };
};
