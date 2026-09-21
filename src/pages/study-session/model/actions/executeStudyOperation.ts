import { getAuthUid } from "@/entities/auth";
import { getStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { saveStudyOperation } from "../../api/saveStudyOperation";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";
import { showStudyResult } from "./showStudyResult";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== operation.uid || owner.deckId !== operation.deckId || getAuthUid() !== operation.uid)
    return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId) return;
  studySessionPageStore.setState({ isSaving: true });
  try {
    const result = await saveStudyOperation(operation, session);
    if (getAuthUid() !== operation.uid || studySessionPageStore.getState().owner !== owner) return;
    const latest = getStudySession(operation.deckId);
    if (latest !== undefined && latest.sessionId !== operation.sessionId) return;
    // Entity subscriptions already reflect the local batch; only presentation remains.
    showStudyResult(result.endReason === "completed", operation.cardCount, operation.direction);
  } catch {
    if (studySessionPageStore.getState().owner === owner && getAuthUid() === operation.uid)
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
  } finally {
    studySessionPageStore.setState({ isSaving: false });
  }
}
