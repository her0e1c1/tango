import { getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { editStudyProgress } from "@/entities/study-progress";
import { getStudySession, moveStudySession, planStudySessionSwipe, removeStudySession } from "@/entities/study-session";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import { hideBackText } from "./hideBackText";

export async function swipeCard(uid: string, deckId: DeckId, direction: SwipeDirection): Promise<void> {
  const { owner, pendingWork } = studySessionPageStore.getState();
  // All directions and subsequent visits share the lock until persistence settles.
  if (pendingWork !== undefined || owner?.uid !== uid || owner.deckId !== deckId) return;
  const preferences = getPreferences();
  const plan = planStudySessionSwipe(getStudySession(deckId), getCards(), preferences.controls[direction], Date.now());
  if (plan.effect === "none") return;
  if (plan.effect === "exit") {
    removeStudySession(deckId);
    if (preferences.appearance.showSwipeFeedback && studySessionPageStore.getState().owner === owner) {
      showSwipeFeedback(direction);
    }
    return;
  }
  // A boundary move removes the session, so completion uses the pre-write snapshot.
  const completesSession = plan.effect === "next" && plan.session.currentIndex === plan.session.cardOrderIds.length - 1;
  const work = Symbol();
  studySessionPageStore.setState((state) => ({
    pendingWork: work,
    pageState: { ...state.pageState, swipePending: true },
  }));
  try {
    // Save even after departure, then apply only a position- and identity-checked movement.
    const saved = await editStudyProgress(uid, plan.progress).then(
      () => true,
      () => false
    );
    if (!saved || !moveStudySession(plan.session, plan.effect)) return;
    if (studySessionPageStore.getState().owner !== owner) return;
    if (preferences.appearance.showSwipeFeedback) showSwipeFeedback(direction);
    if (completesSession) {
      studySessionPageStore.setState((state) => ({
        pageState: { ...state.pageState, completion: { cardCount: plan.session.cardOrderIds.length } },
      }));
    } else if (preferences.appearance.hideBodyWhenCardChanged) {
      hideBackText();
    }
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
