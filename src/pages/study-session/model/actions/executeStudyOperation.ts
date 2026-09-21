import { applyStudySessionWrite, getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearPendingStudyOperation, savePendingStudyOperation } from "../../api/pendingStudyOperation";
import { saveStudyOperation } from "../../api/saveStudyOperation";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";
import { getStudyUid } from "../queries/getStudyUid";
import { showStudyResult } from "./showStudyResult";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== operation.uid || owner.deckId !== operation.deckId || getStudyUid() !== operation.uid)
    return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId || session.remote === undefined) return;
  studySessionPageStore.setState({ isSaving: true, pendingOperation: operation });
  try {
    let result: Awaited<ReturnType<typeof saveStudyOperation>>;
    try {
      // Do not send unless the fixed operation can be recovered after a reload.
      savePendingStudyOperation(operation);
      result = await saveStudyOperation(operation, session);
    } catch {
      if (studySessionPageStore.getState().owner === owner && getStudyUid() === operation.uid) {
        showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
      }
      return;
    }
    // Another visit owns its restored retry token even when it represents this same accepted operation.
    if (getStudyUid() !== operation.uid || studySessionPageStore.getState().owner !== owner) return;
    // Cleanup cannot turn an acknowledged batch into a save failure.
    try {
      clearPendingStudyOperation(operation);
    } catch {
      /* A retained ID can be confirmed against the server on revisit. */
    }
    const current = studySessionPageStore.getState();
    if (current.owner === owner && current.pendingOperation?.id === operation.id)
      studySessionPageStore.setState({ pendingOperation: undefined });
    const latest = getStudySession(operation.deckId);
    if (latest !== undefined && latest.sessionId !== operation.sessionId) return;
    applyStudySessionWrite(result);
    showStudyResult(result.endReason === "completed", operation.cardCount, operation.direction);
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
