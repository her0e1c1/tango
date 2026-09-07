import { useEffect } from "react";
import { useStore } from "zustand";
import { usePreferences } from "@/entities/preference";
import { canMoveStudySession } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import type { StudySessionState } from "../types";
import { advanceStudySession } from "./advanceStudySession";

export function useAutoPlay(sessionState: StudySessionState): void {
  const {
    owner,
    pageState: { autoPlay, helpOpen },
  } = useStore(studySessionPageStore);
  const {
    study: { cardInterval },
  } = usePreferences();
  // Help pauses only the timer, preserving the user's explicit playback choice.
  const session =
    sessionState.status === "studying" &&
    autoPlay &&
    !helpOpen &&
    cardInterval > 0 &&
    owner?.deckId === sessionState.session.deckId &&
    canMoveStudySession(sessionState.session, "next")
      ? sessionState.session
      : undefined;

  useEffect(() => {
    if (session === undefined) return;
    const timeout = window.setTimeout(() => {
      // A departed visit must not advance a matching session in a later visit.
      const current = studySessionPageStore.getState();
      if (current.owner !== owner || !current.pageState.autoPlay || current.pageState.helpOpen) return;
      advanceStudySession(session);
    }, cardInterval * 1000);
    return () => window.clearTimeout(timeout);
  }, [session, owner, cardInterval]);
}
