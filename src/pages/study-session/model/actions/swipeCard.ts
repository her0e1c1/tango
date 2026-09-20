import { getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { studyAttemptInputSchema, studyLocalDate } from "@/entities/study-progress";
import { getStudySession, planStudySessionSwipe, removeStudySession } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import { completeStudyMovement } from "./completeStudyMovement";
import { retryStudy } from "./retryStudy";

export async function swipeCard(uid: string, deckId: DeckId, direction: SwipeDirection): Promise<void> {
  const { owner, pendingWork, pendingOperation, pendingReadFailed } = studySessionPageStore.getState();
  const session = getStudySession(deckId);
  if (!session || pendingWork[session.sessionId] || pendingReadFailed || owner?.uid !== uid || owner.deckId !== deckId)
    return;
  const preferences = getPreferences();
  const plan = planStudySessionSwipe(session, getCards(), preferences.controls[direction]);
  // A retry always uses the original input, even if settings, time, or the cached Card changed.
  if (pendingOperation) {
    if (plan.effect === "next" && plan.rating === pendingOperation.input.rating) await retryStudy();
    return;
  }
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    removeStudySession(deckId);
    if (preferences.appearance.showSwipeFeedback) showSwipeFeedback(direction);
    return;
  }
  if (plan.rating === undefined) {
    completeStudyMovement(uid, plan.session, plan.effect, direction);
    return;
  }
  try {
    const card = getCards().find(({ id }) => id === plan.cardId);
    if (!card) return;
    const answeredAt = new Date();
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const input = studyAttemptInputSchema.parse({
      operationId: crypto.randomUUID(),
      sessionId: session.sessionId,
      deckId,
      cardId: plan.cardId,
      rating: plan.rating,
      answeredAt,
      localDate: studyLocalDate(answeredAt, timeZone),
      timeZone,
      schemaVersion: 1,
    });
    studySessionPageStore.setState({
      pendingOperation: { uid, input, session, direction, localOnly: !("uid" in card) },
    });
    await retryStudy();
  } catch {
    if (studySessionPageStore.getState().owner === owner)
      showToast({ messageKey: "studySession.saveFailure", tone: "error" });
  }
}
