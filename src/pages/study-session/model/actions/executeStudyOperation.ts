import { getAuthUid } from "@/entities/auth";
import { getCards } from "@/entities/card";
import { getPreferences } from "@/entities/preference";
import { editStudyProgress, recordCardStudyProgress } from "@/entities/study-progress";
import {
  applyStudySessionWrite,
  getStudySession,
  moveStudySession,
  setStudySessionIndex,
} from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearPendingStudyOperation, savePendingStudyOperation } from "../../api/pendingStudyOperation";
import { saveStudyOperation } from "../../api/saveStudyOperation";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import type { StudyOperation } from "../studyOperation";
import { hideBackText } from "./hideBackText";

export async function executeStudyOperation(operation: StudyOperation): Promise<void> {
  const { owner, pendingWork } = studySessionPageStore.getState();
  if (pendingWork !== undefined || owner?.uid !== operation.uid || owner.deckId !== operation.deckId) return;
  const session = getStudySession(operation.deckId);
  if (session?.sessionId !== operation.sessionId) return;
  const work = Symbol();
  studySessionPageStore.setState({ pendingWork: work, pendingOperation: operation });
  try {
    // Persist acceptance before sending. A failed write or reload must not turn a retry into a new answer.
    savePendingStudyOperation(operation);
    let completed = operation.targetIndex === operation.cardCount;
    let saved = true;
    if (session.remote !== undefined) {
      const result = await saveStudyOperation(operation);
      if (getAuthUid() === operation.uid) applyStudySessionWrite(result);
      saved = result.status !== "stale";
      completed = result.endReason === "completed";
    } else {
      if (operation.recordProgress) {
        const card = getCards().find(({ id }) => id === operation.cardId);
        if (card === undefined) throw new Error("Study card is unavailable");
        await editStudyProgress(operation.uid, recordCardStudyProgress(card, operation.rating, operation.answeredAt));
      }
      const currentSession = getStudySession(operation.deckId);
      saved =
        currentSession?.sessionId === operation.sessionId && currentSession.currentIndex === operation.currentIndex;
      if (saved)
        saved = completed ? moveStudySession(session) : setStudySessionIndex(operation.deckId, operation.targetIndex);
    }
    clearPendingStudyOperation(operation);
    const current = studySessionPageStore.getState();
    if (current.pendingOperation?.id === operation.id) studySessionPageStore.setState({ pendingOperation: undefined });
    if (current.owner !== owner || !saved) return;
    if (session.remote !== undefined && getAuthUid() !== operation.uid) return;
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
    if (
      studySessionPageStore.getState().owner === owner &&
      (session.remote === undefined || getAuthUid() === operation.uid)
    ) {
      showToast({ messageKey: "studySession.answerSaveFailure", tone: "error" });
    }
  } finally {
    if (studySessionPageStore.getState().pendingWork === work) {
      studySessionPageStore.setState({ pendingWork: undefined });
    }
  }
}
