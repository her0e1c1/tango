import { getAuthUid } from "@/entities/auth";
import { getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { saveStudyOperation } from "./saveStudyOperation";
import { showStudyResult } from "./showStudyResult";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== operation.uid || owner.deckId !== operation.deckId || getAuthUid() !== operation.uid)
    return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId) return;
  const onError = () => {
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === operation.uid)
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
  };
  studySessionPageStore.setState({ isSaving: true });
  try {
    const result = await saveStudyOperation(operation, session, onError);
    if (getAuthUid() !== operation.uid || studySessionPageStore.getState().owner !== owner) return;
    const latest = getStudySession(operation.deckId);
    if (latest !== undefined && latest.sessionId !== operation.sessionId) return;
    showStudyResult(result.endReason === "completed", operation.cardCount, operation.direction);
  } catch {
    onError();
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
