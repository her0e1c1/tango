import { calculateFsrsState, getCards } from "@/entities/card";
import { planStudySessionSwipe } from "../queries/planStudySessionSwipe";
import { getPreferences, type SwipeAction, type SwipeDirection } from "@/entities/preference";
import { getStudySession } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import { executeStudyOperation } from "./executeStudyOperation";
import { abandonStudyPageSession } from "./abandonStudyPageSession";
import { getAuthUid } from "@/entities/auth";

export async function submitStudyAction(
  deckId: string,
  action: SwipeAction,
  direction?: SwipeDirection
): Promise<boolean> {
  const uid = getAuthUid();
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== uid || owner.deckId !== deckId) return false;
  const session = getStudySession(deckId);
  if (session === undefined) return false;
  const cards = getCards();
  const plan = planStudySessionSwipe(session, cards, action);
  if (plan.effect === "none") return false;
  if (plan.effect === "exit") {
    return abandonStudyPageSession(deckId, direction);
  }
  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cards.find(({ id }) => id === cardId);
  if (card === undefined) return false;
  const answeredAt = Date.now();
  await executeStudyOperation({
    id: crypto.randomUUID(),
    uid,
    deckId,
    sessionId: session.sessionId,
    cardId: card.id,
    currentIndex: session.currentIndex,
    cardCount: session.cardOrderIds.length,
    answeredAt,
    ...(plan.rating === undefined
      ? {}
      : { rating: plan.rating, fsrs: calculateFsrsState(card.fsrs, plan.rating, answeredAt) }),
    ...(direction === undefined || !getPreferences().appearance.showSwipeFeedback ? {} : { direction }),
  });
  return false;
}
