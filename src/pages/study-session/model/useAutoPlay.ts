import { canMoveStudySession, moveStudySession } from "@/entities/study-session";

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
  const activeAutoPlaySession =
    sessionState.status === "studying" && autoPlay && cardInterval > 0 ? sessionState.session : undefined;
  const autoPlaySession =
    activeAutoPlaySession !== undefined && canMoveStudySession(activeAutoPlaySession, "next")
      ? activeAutoPlaySession
      : undefined;

  React.useEffect(() => {
    if (activeAutoPlaySession === undefined || autoPlaySession !== undefined) return;

    // A terminal Card ends playback without completing or moving the StudySession.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- The session is an external-store snapshot.
    setAutoPlay(false);
  }, [activeAutoPlaySession, autoPlaySession]);

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
