import { getCards } from "@/entities/card";
import { getPreferences, type SwipeAction, type SwipeDirection } from "@/entities/preference";
import { recordCardStudyProgress } from "@/entities/study-progress";
import { abandonStudySession, getStudySession, planStudySessionSwipe } from "@/entities/study-session";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { readPendingStudyOperation } from "../../api/pendingStudyOperation";
import { studySessionPageStore } from "../store";
import { saveLocalStudyProgress } from "./saveLocalStudyProgress";
import { executeStudyOperation } from "./executeStudyOperation";
import { getStudyUid } from "../queries/getStudyUid";

export async function submitStudyAction(
  deckId: string,
  action: SwipeAction,
  direction?: SwipeDirection
): Promise<void> {
  const uid = getStudyUid();
  const { owner, isSaving, pendingOperation } = studySessionPageStore.getState();
  if (isSaving || pendingOperation !== undefined || owner?.uid !== uid || owner.deckId !== deckId) return;
  const session = getStudySession(deckId);
  if (session === undefined) return;
  if (
    session.remote !== undefined &&
    readPendingStudyOperation(uid, session.sessionId)?.currentIndex === session.currentIndex
  )
    return;
  const cards = getCards();
  const plan = planStudySessionSwipe(session, cards, action);
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    abandonStudySession(deckId);
    if (direction !== undefined && getPreferences().appearance.showSwipeFeedback) showSwipeFeedback(direction);
    return;
  }
  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cards.find(({ id }) => id === cardId);
  if (card === undefined) return;
  const answeredAt = Date.now();
  const progress = recordCardStudyProgress(card, plan.rating, answeredAt);
  if (session.remote === undefined) {
    await saveLocalStudyProgress(uid, session, progress, direction);
    return;
  }
  await executeStudyOperation({
    id: crypto.randomUUID(),
    uid,
    deckId,
    sessionId: session.sessionId,
    cardId: card.id,
    currentIndex: session.currentIndex,
    cardCount: session.cardOrderIds.length,
    answeredAt,
    progress: { difficulty: progress.difficulty, numberOfSeen: progress.numberOfSeen },
    ...(plan.rating === undefined ? {} : { rating: plan.rating }),
    ...(direction === undefined || !getPreferences().appearance.showSwipeFeedback ? {} : { direction }),
  });
}
