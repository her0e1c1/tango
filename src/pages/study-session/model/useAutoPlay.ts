import { canMoveStudySession, moveStudySession } from "@/entities/study-session";

import * as React from "react";

import type { StudySessionState } from "./useStudySessionState";

interface AutoPlayOptions {
  defaultAutoPlay: boolean;
  cardInterval: number;
  paused: boolean;
  onAdvance: () => void;
}

export const useAutoPlay = (
  sessionState: StudySessionState,
  { defaultAutoPlay, cardInterval, paused, onAdvance }: AutoPlayOptions
) => {
  const [autoPlay, setAutoPlay] = React.useState(defaultAutoPlay);
  const onAdvanceEvent = React.useEffectEvent(onAdvance);
  const autoPlaySession =
    sessionState.status === "studying" &&
    autoPlay &&
    !paused &&
    cardInterval > 0 &&
    canMoveStudySession(sessionState.session, "next")
      ? sessionState.session
      : undefined;

  React.useEffect(() => {
    if (autoPlaySession === undefined) return;
    const timeout = window.setTimeout(() => {
      if (moveStudySession(autoPlaySession, "next")) onAdvanceEvent();
    }, cardInterval * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlaySession, cardInterval]);

  return {
    autoPlay,
    toggleAutoPlay: () => setAutoPlay((playing) => !playing),
  };
};
