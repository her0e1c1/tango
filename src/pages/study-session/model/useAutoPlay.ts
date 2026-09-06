import { canMoveStudySession } from "@/entities/study-session";

import * as React from "react";

import type { StudySessionState } from "./types";
import { advanceStudySession } from "./actions/advanceStudySession";

interface AutoPlayOptions {
  autoPlay: boolean;
  cardInterval: number;
  paused: boolean;
  onAdvance: () => void;
}

export const useAutoPlay = (
  sessionState: StudySessionState,
  { autoPlay, cardInterval, paused, onAdvance }: AutoPlayOptions
) => {
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
      advanceStudySession(autoPlaySession, onAdvanceEvent);
    }, cardInterval * 1000);
    return () => window.clearTimeout(timeout);
  }, [autoPlaySession, cardInterval]);
};
