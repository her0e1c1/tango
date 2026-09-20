import { readPendingStudyOperation } from "../../api/pendingStudyOperation";
import { studySessionPageStore } from "../store";

export function restoreStudyOperation(uid: string, deckId: string, sessionId: string | undefined): void {
  const { owner } = studySessionPageStore.getState();
  if (owner?.uid !== uid || owner.deckId !== deckId) return;
  // A final answer can remove the active session before its acknowledgement reaches the action.
  if (sessionId === undefined) return;
  const pendingOperation = readPendingStudyOperation(uid, sessionId);
  studySessionPageStore.setState({ pendingOperation });
}
