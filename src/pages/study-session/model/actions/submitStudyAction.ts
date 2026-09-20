import { getCards } from "@/entities/card";
import { getPreferences, type SwipeAction, type SwipeDirection } from "@/entities/preference";
import { abandonStudySession, getStudySession, planStudySessionSwipe } from "@/entities/study-session";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { readPendingStudyOperation } from "../../api/pendingStudyOperation";
import { studySessionPageStore } from "../store";
import { executeStudyOperation } from "./executeStudyOperation";

export async function submitStudyAction(
  uid: string,
  deckId: string,
  action: SwipeAction,
  direction?: SwipeDirection
): Promise<void> {
  const { owner, pendingWork, pendingOperation } = studySessionPageStore.getState();
  if (pendingWork !== undefined || pendingOperation !== undefined || owner?.uid !== uid || owner.deckId !== deckId)
    return;
  const session = getStudySession(deckId);
  if (session === undefined || readPendingStudyOperation(uid, session.sessionId) !== undefined) return;
  const answeredAt = Date.now();
  const plan = planStudySessionSwipe(session, getCards(), action, answeredAt);
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    abandonStudySession(deckId);
    if (direction !== undefined && getPreferences().appearance.showSwipeFeedback) showSwipeFeedback(direction);
    return;
  }
  const cardId = session.cardOrderIds[session.currentIndex];
  if (cardId === undefined) return;
  await executeStudyOperation({
    id: crypto.randomUUID(),
    uid,
    deckId,
    sessionId: session.sessionId,
    cardId,
    currentIndex: session.currentIndex,
    targetIndex: session.currentIndex + 1,
    cardCount: session.cardOrderIds.length,
    answeredAt,
    recordProgress: true,
    ...(plan.rating === undefined ? {} : { rating: plan.rating }),
    ...(direction === undefined || !getPreferences().appearance.showSwipeFeedback ? {} : { direction }),
  });
}
