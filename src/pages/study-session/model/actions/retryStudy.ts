import { getAuthUid } from "@/entities/auth";
import { getStudySession, isStudySessionPositionUnchanged } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { clearPendingStudy, savePendingStudy } from "../../api/pendingStudy";
import { recordStudy } from "../../api/recordStudy";
import { studySessionPageStore } from "../store";
import { completeStudyMovement } from "./completeStudyMovement";

export async function retryStudy(): Promise<void> {
  const { pendingOperation: pending, owner, pendingWork } = studySessionPageStore.getState();
  if (
    !pending ||
    getAuthUid() !== pending.uid ||
    owner?.uid !== pending.uid ||
    owner.deckId !== pending.input.deckId ||
    pendingWork[pending.input.sessionId]
  )
    return;
  const work = Symbol();
  const sessionId = pending.input.sessionId;
  studySessionPageStore.setState((state) => ({
    pendingWork: { ...state.pendingWork, [sessionId]: work },
    pageState: { ...state.pageState, swipePending: true },
  }));
  try {
    // Synchronous durable storage must succeed before the first send, including after a storage failure.
    savePendingStudy(pending);
    await recordStudy(pending.uid, pending.input, pending.localOnly);
    const current = studySessionPageStore.getState();
    if (
      getAuthUid() !== pending.uid ||
      current.owner !== owner ||
      current.pendingOperation?.input.operationId !== pending.input.operationId
    )
      return;
    if (isStudySessionPositionUnchanged(pending.session, getStudySession(pending.input.deckId))) {
      completeStudyMovement(pending.uid, pending.session, "next", pending.direction);
    }
    clearPendingStudy(pending);
    studySessionPageStore.setState({ pendingOperation: undefined });
  } catch {
    const current = studySessionPageStore.getState();
    if (
      getAuthUid() === pending.uid &&
      current.owner === owner &&
      current.pendingOperation?.input.operationId === pending.input.operationId
    ) {
      showToast({ messageKey: "studySession.saveFailure", tone: "error" });
    }
  } finally {
    const current = studySessionPageStore.getState();
    if (current.pendingWork[sessionId] === work) {
      const remaining = { ...current.pendingWork };
      delete remaining[sessionId];
      studySessionPageStore.setState({
        pendingWork: remaining,
        ...((current.owner === owner && current.pendingOperation === undefined) ||
        current.pendingOperation?.input.operationId === pending.input.operationId
          ? { pageState: { ...current.pageState, swipePending: false } }
          : {}),
      });
    }
  }
}
