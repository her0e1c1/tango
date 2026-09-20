import type { StudySession } from "@/entities/study-session";
import { readPendingStudy } from "../../api/pendingStudy";
import { studySessionPageStore } from "../store";

export function restorePendingStudy(uid: string, session: StudySession): void {
  const state = studySessionPageStore.getState();
  if (
    state.owner?.uid !== uid ||
    state.owner.deckId !== session.deckId ||
    state.pendingOperation?.input.sessionId === session.sessionId
  )
    return;
  try {
    studySessionPageStore.setState({
      pendingOperation: readPendingStudy(uid, session),
      pendingReadFailed: false,
      pageState: { ...state.pageState, swipePending: state.pendingWork[session.sessionId] !== undefined },
    });
  } catch {
    studySessionPageStore.setState({ pendingReadFailed: true });
  }
}
