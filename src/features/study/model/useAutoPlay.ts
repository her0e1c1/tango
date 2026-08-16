import { moveStudySession, planStudySessionAutoPlay } from "@/entities/study-session";

import * as React from "react";

import type { StudySessionState } from "./useStudySessionState";

interface AutoPlayOptions {
  defaultAutoPlay: boolean;
  cardInterval: number;
  onAdvance: () => void;
}

export const useAutoPlay = (
  sessionState: StudySessionState,
  { defaultAutoPlay, cardInterval, onAdvance }: AutoPlayOptions
) => {
  const [autoPlay, setAutoPlay] = React.useState(defaultAutoPlay);
  const onAdvanceEvent = React.useEffectEvent(onAdvance);
  const autoPlayPlan = planStudySessionAutoPlay(sessionState, {
    enabled: autoPlay,
    intervalSeconds: cardInterval,
  });
  const autoPlaySession = autoPlayPlan?.session;
  const autoPlayIntervalSeconds = autoPlayPlan?.intervalSeconds;

  React.useEffect(() => {
    if (autoPlaySession === undefined || autoPlayIntervalSeconds === undefined) return;
    const timeout = window.setTimeout(() => {
      if (moveStudySession(autoPlaySession, "next")) onAdvanceEvent();
    }, autoPlayIntervalSeconds * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlayIntervalSeconds, autoPlaySession]);

  return {
    autoPlay,
    toggleAutoPlay: () => setAutoPlay((playing) => !playing),
  };
};
