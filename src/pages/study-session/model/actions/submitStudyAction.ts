import { calculateStudySchedule, classifyStudySchedule } from "@/entities/study-schedule";
import { getCards } from "@/entities/card";
import { getPreferences, type SwipeAction, type SwipeDirection } from "@/entities/preference";
import { recordCardStudyProgress } from "@/entities/study-progress";
import { abandonStudySession, getStudySession, planStudySessionSwipe } from "@/entities/study-session";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import { executeStudyOperation } from "./executeStudyOperation";
import { showToast } from "@/shared/ui/toast";
import { getAuthUid } from "@/entities/auth";

export async function submitStudyAction(
  deckId: string,
  action: SwipeAction,
  direction?: SwipeDirection
): Promise<void> {
  const uid = getAuthUid();
  const { owner, isSaving } = studySessionPageStore.getState();
  if (isSaving || owner?.uid !== uid || owner.deckId !== deckId) return;
  const session = getStudySession(deckId);
  if (session === undefined) return;
  const cards = getCards();
  const plan = planStudySessionSwipe(session, cards, action);
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    studySessionPageStore.setState({ isSaving: true });
    try {
      await abandonStudySession(deckId);
      if (
        studySessionPageStore.getState().owner === owner &&
        getAuthUid() === uid &&
        direction !== undefined &&
        getPreferences().appearance.showSwipeFeedback
      )
        showSwipeFeedback(direction);
    } catch {
      if (studySessionPageStore.getState().owner === owner && getAuthUid() === uid)
        showToast({ messageKey: "toast.saveFailure", tone: "error" });
    } finally {
      studySessionPageStore.setState({ isSaving: false });
    }
    return;
  }
  const cardId = session.cardOrderIds[session.currentIndex];
  const card = cards.find(({ id }) => id === cardId);
  if (card === undefined) return;
  const answeredAt = Date.now();
  classifyStudySchedule(card, answeredAt);
  const progress = recordCardStudyProgress(card, plan.rating, answeredAt);
  await executeStudyOperation({
    id: crypto.randomUUID(),
    uid,
    deckId,
    sessionId: session.sessionId,
    cardId: card.id,
    currentIndex: session.currentIndex,
    cardCount: session.cardOrderIds.length,
    answeredAt,
    progress: {
      difficulty: progress.difficulty,
      numberOfSeen: progress.numberOfSeen,
    },
    ...(plan.rating === undefined
      ? {}
      : { rating: plan.rating, schedule: calculateStudySchedule(card.schedule, plan.rating, answeredAt) }),
    ...(direction === undefined || !getPreferences().appearance.showSwipeFeedback ? {} : { direction }),
  });
}
