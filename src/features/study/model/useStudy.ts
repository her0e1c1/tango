import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { type SwipeDirection, usePreferences } from "@/entities/preferences";
import type { StudySession } from "@/entities/study-session";

import { useStudyControls } from "./useStudyControls";
import { useStudySessionState } from "./useStudySessionState";
import { useSwipe } from "./useSwipe";

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

export const useStudy = (deckId: DeckId, cards: readonly Card[]): StudyState => {
  const preferences = usePreferences();
  const sessionState = useStudySessionState(deckId, cards);
  const controls = useStudyControls(deckId, sessionState, {
    defaultAutoPlay: preferences.study.defaultAutoPlay,
    cardInterval: preferences.study.cardInterval,
  });
  const swipe = useSwipe(deckId, cards, controls.hideBackText);
  const commands: StudyCommands = {
    swipeUp: swipe.swipeUp,
    swipeDown: swipe.swipeDown,
    swipeLeft: swipe.swipeLeft,
    swipeRight: swipe.swipeRight,
    toggleBackText: controls.toggleBackText,
    toggleAutoPlay: controls.toggleAutoPlay,
  };

  if (sessionState.status !== "studying") return { status: sessionState.status, ...commands };

  return {
    status: "studying",
    ...commands,
    session: sessionState.session,
    card: sessionState.card,
    showHeader: preferences.appearance.showHeader && !controls.showBackText,
    showBackText: controls.showBackText,
    showController: preferences.study.cardInterval > 0,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    autoPlay: controls.autoPlay,
    updateIndex: controls.updateIndex,
    ...(swipe.swipeFeedback !== undefined ? { swipeFeedback: swipe.swipeFeedback } : {}),
  };
};
