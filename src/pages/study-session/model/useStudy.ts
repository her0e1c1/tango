import * as React from "react";

import { useCards, useLocalCardsHydrated } from "@/entities/card";
import { getCategory, isHighlightLanguage, useDeck } from "@/entities/deck";
import {
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
  usePreferences,
} from "@/entities/preference";
import { setStudySessionIndex } from "@/entities/study-session";

import { useAutoPlay } from "./useAutoPlay";
import { buildStudyHelpContent } from "./studyHelp";
import { useStudySessionState } from "./useStudySessionState";
import { useSwipe } from "./useSwipe";

export const useStudy = (deckId: string) => {
  const cards = useCards();
  const localCardsHydrated = useLocalCardsHydrated();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const sessionState = useStudySessionState(deck, cards, localCardsHydrated);
  const [showBackText, setShowBackText] = React.useState(false);
  const [helpOpen, setHelpOpen] = React.useState(false);
  const hideBackText = () => setShowBackText(false);
  const { autoPlay, toggleAutoPlay } = useAutoPlay(sessionState, {
    defaultAutoPlay: preferences.study.defaultAutoPlay,
    cardInterval: preferences.study.cardInterval,
    // Keep the user's explicit play/pause state while preventing a modal from advancing the hidden Card.
    paused: helpOpen,
    onAdvance: hideBackText,
  });
  const swipeCards =
    sessionState.status === "studying" && !cards.some(({ id }) => id === sessionState.card.id)
      ? [...cards, sessionState.card]
      : cards;
  const verifiedRemoteCardId =
    sessionState.status === "studying" &&
    "uid" in sessionState.card &&
    !cards.some(({ id }) => id === sessionState.card.id)
      ? sessionState.card.id
      : undefined;
  const swipe = useSwipe(deckId, swipeCards, hideBackText, verifiedRemoteCardId);

  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };
  const controls = {
    ...swipe,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleSwipeButtonList: toggleShowSwipeButtonList,
    showBackText,
    playbackControlsAvailable: preferences.study.cardInterval > 0,
    showCardDetails: preferences.controls.showCardDetails,
    showPlaybackControls: preferences.controls.showPlaybackControls,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    showBackTextSwipeOverlays: preferences.controls.showBackTextSwipeOverlays,
    autoPlay,
    updateIndex,
    help: {
      ...buildStudyHelpContent(preferences, document.documentElement.lang),
      open: helpOpen,
      openHelp: () => setHelpOpen(true),
      closeHelp: () => setHelpOpen(false),
    },
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
