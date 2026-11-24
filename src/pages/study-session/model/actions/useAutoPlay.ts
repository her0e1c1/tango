import { useTimeoutFn, useUpdateEffect } from "react-use";
import { useStore } from "zustand";
import { usePreferences } from "@/entities/preference";
import { canMoveStudySession } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import type { StudySessionState } from "../queries/useStudyQuery";
import { advanceStudySession } from "./advanceStudySession";

export function useAutoPlay(sessionState: StudySessionState): void {
  const {
    owner,
    isSaving,
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
    !isSaving &&
    cardInterval > 0 &&
    owner?.deckId === sessionState.session.deckId &&
    canMoveStudySession(sessionState.session)
      ? sessionState.session
      : undefined;

  const [, cancel, restart] = useTimeoutFn(() => {
    if (session === undefined) return;
    // A departed visit must not advance a matching session in a later visit.
    const current = studySessionPageStore.getState();
    if (current.owner !== owner || !current.pageState.autoPlay || current.pageState.helpOpen) return;
    advanceStudySession(session);
  }, cardInterval * 1000);
  useUpdateEffect(() => {
    if (session === undefined) cancel();
    else restart();
  }, [session, owner, cardInterval, cancel, restart]);
}
