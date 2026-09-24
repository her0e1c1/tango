import { getAuthUid } from "@/entities/auth";
import { getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearSettledStudySession } from "./clearSettledStudySession";
import { saveStudyOperation } from "./saveStudyOperation";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== operation.uid || owner.deckId !== operation.deckId || getAuthUid() !== operation.uid)
    return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId) return;
  const saveToken = {};
  studySessionPageStore.setState({ isSaving: true, savingSession: session, awaitingRollback: false, saveToken });
  const onLocalError = () => {
    if (studySessionPageStore.getState().saveToken === saveToken) {
      studySessionPageStore.setState({ awaitingRollback: true, savingSession: session, pendingResult: undefined });
      clearSettledStudySession();
    }
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === operation.uid)
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
  };
  try {
    const result = await saveStudyOperation(operation, session, onLocalError);
    if (studySessionPageStore.getState().saveToken !== saveToken || studySessionPageStore.getState().awaitingRollback)
      return;
    if (getAuthUid() !== operation.uid || studySessionPageStore.getState().owner !== owner) {
      studySessionPageStore.setState({
        isSaving: false,
        savingSession: undefined,
        pendingResult: undefined,
        saveToken: undefined,
      });
      return;
    }
    const latest = getStudySession(operation.deckId);
    if (latest !== undefined && latest.sessionId !== operation.sessionId) {
      studySessionPageStore.setState({
        isSaving: false,
        savingSession: undefined,
        pendingResult: undefined,
        saveToken: undefined,
      });
      return;
    }
    studySessionPageStore.setState({
      pendingResult: {
        deckId: operation.deckId,
        sessionId: operation.sessionId,
        currentIndex: result.session.currentIndex,
        completed: result.endReason === "completed",
        cardCount: operation.cardCount,
        direction: operation.direction,
      },
    });
  } catch {
    // Firestore rejects the write before publishing its rollback snapshot.
    studySessionPageStore.setState({ awaitingRollback: true, pendingResult: undefined });
    clearSettledStudySession();
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === operation.uid)
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
  }
}
