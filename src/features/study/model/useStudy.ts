import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { usePreferences } from "@/entities/preferences";

import { useStudyControls } from "./useStudyControls";
import { useStudySessionState } from "./useStudySessionState";
import { useSwipe } from "./useSwipe";

export const useStudy = (deckId: DeckId, cards: readonly Card[]) => {
  const preferences = usePreferences();
  const sessionState = useStudySessionState(deckId, cards);
  const controls = useStudyControls(deckId, sessionState, {
    defaultAutoPlay: preferences.study.defaultAutoPlay,
    cardInterval: preferences.study.cardInterval,
  });
  const swipe = useSwipe(deckId, cards, controls.hideBackText);

  return {
    ...sessionState,
    ...swipe,
    toggleBackText: controls.toggleBackText,
    toggleAutoPlay: controls.toggleAutoPlay,
    showHeader: preferences.appearance.showHeader && !controls.showBackText,
    showBackText: controls.showBackText,
    showController: preferences.study.cardInterval > 0,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    autoPlay: controls.autoPlay,
    updateIndex: controls.updateIndex,
  };
};

export type StudyState = ReturnType<typeof useStudy>;
