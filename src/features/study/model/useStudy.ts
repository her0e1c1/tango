import * as React from "react";

import { useCards } from "@/entities/card";
import { getCategory, isHighlightLanguage, useDeck } from "@/entities/deck";
import { toggleShowHeader, toggleShowSwipeButtonList, usePreferences } from "@/entities/preferences";
import { setStudySessionIndex } from "@/entities/study-session";

import { useAutoPlay } from "./useAutoPlay";
import { useStudySessionState } from "./useStudySessionState";
import { useSwipe } from "./useSwipe";

export const useStudyDeck = (deckId: string) => useDeck(deckId);

export const useStudy = (deckId: string) => {
  const cards = useCards();
  const deck = useStudyDeck(deckId);
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
  const controls = {
    ...swipe,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay,
    toggleHeader: toggleShowHeader,
    toggleSwipeButtonList: toggleShowSwipeButtonList,
    showHeader: preferences.appearance.showHeader && !showBackText,
    showBackText,
    showController: preferences.study.cardInterval > 0,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    autoPlay,
    updateIndex,
  };

  if (deck == null) return;
  if (sessionState.status !== "studying") return { ...controls, status: sessionState.status };

  const category = getCategory(deck.category, sessionState.card.tags);
  return {
    ...controls,
    status: "studying" as const,
    session: {
      currentIndex: sessionState.session.currentIndex,
      cardCount: sessionState.session.cardOrderIds.length,
    },
    card: {
      frontText: sessionState.card.frontText,
      category,
      score: sessionState.card.score,
      numberOfSeen: sessionState.card.numberOfSeen,
      ...(sessionState.card.lastSeenAt !== undefined ? { lastSeenAt: sessionState.card.lastSeenAt } : {}),
      back: {
        text: sessionState.card.backText,
        category,
        code: isHighlightLanguage(category),
        dark: preferences.appearance.darkMode,
      },
    },
  };
};

export type StudyState = NonNullable<ReturnType<typeof useStudy>>;
