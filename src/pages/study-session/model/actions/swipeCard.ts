import { getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { saveStudyAnswer } from "../../api/saveStudyAnswer";
import { showToast } from "@/shared/ui/toast";
import { abandonStudySession, getStudySession, planStudySessionSwipe } from "@/entities/study-session";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import { hideBackText } from "./hideBackText";

export async function swipeCard(uid: string, deckId: DeckId, direction: SwipeDirection): Promise<void> {
  const { owner, pendingWork } = studySessionPageStore.getState();
  // All directions and subsequent visits share the lock until persistence settles.
  if (pendingWork !== undefined || owner?.uid !== uid || owner.deckId !== deckId) return;
  const preferences = getPreferences();
  const answeredAt = Date.now();
  const plan = planStudySessionSwipe(getStudySession(deckId), getCards(), preferences.controls[direction], answeredAt);
  if (plan.effect === "none") return;
  // A boundary move removes the session, so completion uses the pre-write snapshot.
  const completesSession = plan.effect === "next" && plan.session.currentIndex === plan.session.cardOrderIds.length - 1;
  const work = Symbol();
  studySessionPageStore.setState((state) => ({
    pendingWork: work,
    pageState: { ...state.pageState, swipePending: true },
  }));
  try {
    if (plan.effect === "exit") await abandonStudySession(deckId);
    else await saveStudyAnswer(uid, plan.session, preferences.controls[direction], answeredAt);
    if (studySessionPageStore.getState().owner !== owner) return;
    const current = getStudySession(deckId);
    if (plan.effect === "next" && current && current.sessionId !== plan.session.sessionId) return;
    if (preferences.appearance.showSwipeFeedback) showSwipeFeedback(direction);
    if (plan.effect === "next" && completesSession) {
      studySessionPageStore.setState((state) => ({
        pageState: { ...state.pageState, completion: { cardCount: plan.session.cardOrderIds.length } },
      }));
    } else if (preferences.appearance.hideBodyWhenCardChanged) {
      hideBackText();
    }
  } catch {
    if (studySessionPageStore.getState().owner === owner) showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    // An old completion may release only its own work and update only its own visit.
    const state = studySessionPageStore.getState();
    if (state.pendingWork === work) {
      studySessionPageStore.setState({
        pendingWork: undefined,
        ...(state.owner === owner ? { pageState: { ...state.pageState, swipePending: false } } : {}),
      });
    }
  }
}
