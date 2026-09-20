import { getStudySession } from "@/entities/study-session";
import { readPendingStudyOperation } from "../../api/pendingStudyOperation";
import { studySessionPageStore } from "../store";
import { executeStudyOperation } from "./executeStudyOperation";

export async function updateStudyIndex(deckId: string, targetIndex: number): Promise<void> {
  const { owner, pendingWork, pendingOperation } = studySessionPageStore.getState();
  if (owner?.deckId !== deckId || pendingWork !== undefined || pendingOperation !== undefined) return;
  const session = getStudySession(deckId);
  if (
    session === undefined ||
    !Number.isInteger(targetIndex) ||
    targetIndex <= session.currentIndex ||
    targetIndex >= session.cardOrderIds.length ||
    readPendingStudyOperation(owner.uid, session.sessionId) !== undefined
  )
    return;
  const cardId = session.cardOrderIds[session.currentIndex];
  if (cardId === undefined) return;
  await executeStudyOperation({
    id: crypto.randomUUID(),
    uid: owner.uid,
    deckId,
    sessionId: session.sessionId,
    cardId,
    currentIndex: session.currentIndex,
    targetIndex,
    cardCount: session.cardOrderIds.length,
    answeredAt: Date.now(),
    recordProgress: false,
  });
}
