import type { DeckId } from "@/entities/deck";
import { moveStudySession, planStudySessionAutoPlay, setStudySessionIndex } from "@/entities/study-session";

import * as React from "react";

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
  const [autoPlay, setAutoPlay] = React.useState(defaultAutoPlay);
  const hideBackText = () => setShowBackText(false);
  const autoPlayPlan = planStudySessionAutoPlay(sessionState, {
    enabled: autoPlay,
    intervalSeconds: cardInterval,
  });
  const autoPlaySession = autoPlayPlan?.session;
  const autoPlayIntervalSeconds = autoPlayPlan?.intervalSeconds;

  React.useEffect(() => {
    if (autoPlaySession === undefined || autoPlayIntervalSeconds === undefined) return;
    const timeout = window.setTimeout(() => {
      if (moveStudySession(autoPlaySession, "next")) setShowBackText(false);
    }, autoPlayIntervalSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlayIntervalSeconds, autoPlaySession]);

  const updateIndex = (currentIndex: number): void => {
    if (!setStudySessionIndex(deckId, currentIndex)) return;
    hideBackText();
  };

  return {
    showBackText,
    autoPlay,
    hideBackText,
    toggleBackText: () => setShowBackText((visible) => !visible),
    toggleAutoPlay: () => setAutoPlay((playing) => !playing),
    updateIndex,
  };
};
