import { getPreferences } from "@/entities/preference";
import { editStudyProgress } from "@/entities/study-progress";
import { applyStudySessionWrite, getStudySession, moveStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearPendingStudyOperation, savePendingStudyOperation } from "../../api/pendingStudyOperation";
import { saveStudyOperation } from "../../api/saveStudyOperation";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";
import { hideBackText } from "./hideBackText";
import { getStudyUid } from "../queries/getStudyUid";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, pendingWork } = studySessionPageStore.getState();
  if (
    pendingWork !== undefined ||
    owner?.uid !== operation.uid ||
    owner.deckId !== operation.deckId ||
    getStudyUid() !== operation.uid
  )
    return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId) return;
  const work = Symbol();
  studySessionPageStore.setState({ pendingWork: work, pendingOperation: operation });
  try {
    // Persist acceptance before sending. A failed write or reload must not turn a retry into a new answer.
    savePendingStudyOperation(operation);
    let completed = operation.currentIndex + 1 === operation.cardCount;
    let saved = true;
    if (session.remote !== undefined) {
      const result = await saveStudyOperation(operation);
      if (getStudyUid() === operation.uid) applyStudySessionWrite(result);
      saved = result.status !== "stale";
      completed = result.endReason === "completed";
    } else if (session.currentIndex !== operation.currentIndex) {
      saved = false;
    } else {
      if (operation.localProgress === undefined) throw new Error("Accepted local progress is missing");
      // Reapply the accepted absolute values after partial storage failures, never increment them again.
      await editStudyProgress(operation.uid, operation.localProgress);
      saved = getStudyUid() === operation.uid && moveStudySession(session);
    }
    clearPendingStudyOperation(operation);
    const current = studySessionPageStore.getState();
    if (current.pendingOperation?.id === operation.id) studySessionPageStore.setState({ pendingOperation: undefined });
    if (current.owner !== owner || !saved) return;
    if (getStudyUid() !== operation.uid) return;
    const latest = getStudySession(operation.deckId);
    if (latest !== undefined && latest.sessionId !== operation.sessionId) return;
    const preferences = getPreferences();
    if (preferences.appearance.showSwipeFeedback && operation.direction !== undefined) {
      showSwipeFeedback(operation.direction);
    }
    if (completed) {
      studySessionPageStore.setState((state) => ({
        pageState: { ...state.pageState, completion: { cardCount: operation.cardCount } },
      }));
    } else if (preferences.appearance.hideBodyWhenCardChanged) {
      hideBackText();
    }
  } catch {
    if (studySessionPageStore.getState().owner === owner && getStudyUid() === operation.uid) {
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
    }
  } finally {
    if (studySessionPageStore.getState().pendingWork === work) {
      studySessionPageStore.setState({ pendingWork: undefined });
    }
  }
}
