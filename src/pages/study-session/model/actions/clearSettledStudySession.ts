import { getAuthUid } from "@/entities/auth";
import { getStudySession } from "@/entities/study-session";
import { studySessionPageStore } from "../store";

export function clearSettledStudySession(): void {
  const { awaitingRollback, savingSession } = studySessionPageStore.getState();
  if (!awaitingRollback || savingSession === undefined) return;
  const current = getStudySession(savingSession.deckId);
  const restored =
    current?.currentIndex === savingSession.currentIndex &&
    current.cardOrderIds[current.currentIndex] === savingSession.cardOrderIds[savingSession.currentIndex];
  if (
    getAuthUid() !== savingSession.remote.uid ||
    (current !== undefined && (current.sessionId !== savingSession.sessionId || restored))
  )
    studySessionPageStore.setState({
      savingSession: undefined,
      awaitingRollback: false,
      isSaving: false,
      saveToken: undefined,
    });
}
