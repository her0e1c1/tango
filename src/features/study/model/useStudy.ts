import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";
import { setStudySessionIndex } from "@/entities/study-session";

import * as React from "react";

import { useAutoPlay } from "./useAutoPlay";
import { useStudySessionState } from "./useStudySessionState";
import { useSwipe } from "./useSwipe";

export const useStudy = (deckId: DeckId, cards: readonly Card[]) => {
  const preferences = usePreferences();
  const sessionState = useStudySessionState(deckId, cards);
  const [showBackText, setShowBackText] = React.useState(false);
  const hideBackText = () => setShowBackText(false);
  const { autoPlay, toggleAutoPlay } = useAutoPlay(sessionState, {
    defaultAutoPlay: preferences.study.defaultAutoPlay,
    cardInterval: preferences.study.cardInterval,
    onAdvance: hideBackText,
  });
  const swipe = useSwipe(deckId, cards, hideBackText);

  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };

  return {
    ...sessionState,
    ...swipe,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay,
    showHeader: preferences.appearance.showHeader && !showBackText,
    showBackText,
    showController: preferences.study.cardInterval > 0,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    autoPlay,
    updateIndex,
  };
};

export type StudyState = ReturnType<typeof useStudy>;
