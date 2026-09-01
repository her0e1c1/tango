import * as React from "react";

import { useCards } from "@/entities/card";
import { getCategory, isHighlightLanguage, useDeck } from "@/entities/deck";
import {
  toggleShowCardDetails,
  toggleShowHelp,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
  usePreferences,
  type SwipeDirection,
} from "@/entities/preference";
import { setStudySessionIndex } from "@/entities/study-session";

import { useAutoPlay } from "./useAutoPlay";
import { buildStudyHelpRows } from "./studyHelp";
import { useStudySessionState } from "./useStudySessionState";
import { type StudyCompletion, useSwipe } from "./useSwipe";

export const useStudy = (deckId: string, onSwipeFeedback: (direction: SwipeDirection) => void) => {
  const cards = useCards();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const sessionState = useStudySessionState(deckId, cards);
  const [completion, setCompletion] = React.useState<StudyCompletion>();
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
  const swipe = useSwipe(deckId, cards, {
    onCardChanged: hideBackText,
    onCompleted: setCompletion,
    onSwipeFeedback,
  });

  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };
  const controls = {
    ...swipe,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleSwipeButtonList: toggleShowSwipeButtonList,
    showBackText,
    showHelp: preferences.controls.showHelp,
    playbackControlsAvailable: preferences.study.cardInterval > 0,
    showCardDetails: preferences.controls.showCardDetails,
    showPlaybackControls: preferences.controls.showPlaybackControls,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    showBackTextSwipeOverlays: preferences.controls.showBackTextSwipeOverlays,
    autoPlay,
    updateIndex,
    help: {
      rows: buildStudyHelpRows(preferences),
      open: helpOpen,
      openHelp: () => setHelpOpen(true),
      closeHelp: () => setHelpOpen(false),
    },
  };

  if (deck == null) return;
  if (completion != null) return { status: "completed" as const, completion };
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
      difficulty: sessionState.card.difficulty,
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
