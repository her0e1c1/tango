import type { DeckId } from "@/entities/deck";
import { setStudySessionIndex } from "@/entities/study-session";

import * as React from "react";

import { useAutoPlay } from "./useAutoPlay";
import type { StudySessionState } from "./useStudySessionState";

interface StudyControlOptions {
  defaultAutoPlay: boolean;
  cardInterval: number;
}

export const useStudyControls = (
  deckId: DeckId,
  sessionState: StudySessionState,
  { defaultAutoPlay, cardInterval }: StudyControlOptions
) => {
  const [showBackText, setShowBackText] = React.useState(false);
  const hideBackText = () => setShowBackText(false);
  const { autoPlay, toggleAutoPlay } = useAutoPlay(sessionState, {
    defaultAutoPlay,
    cardInterval,
    onAdvance: hideBackText,
  });

  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };

  return {
    showBackText,
    autoPlay,
    hideBackText,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay,
    updateIndex,
  };
};
