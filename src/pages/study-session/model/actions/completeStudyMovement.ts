import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { moveStudySession, type StudySession } from "@/entities/study-session";
import { studySessionPageStore } from "../store";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { hideBackText } from "./hideBackText";

export function completeStudyMovement(
  uid: string,
  session: StudySession,
  effect: "next" | "previous",
  direction: SwipeDirection
): boolean {
  const { owner } = studySessionPageStore.getState();
  if (owner?.uid !== uid || owner.deckId !== session.deckId || !moveStudySession(session, effect)) return false;
  const preferences = getPreferences();
  if (preferences.appearance.showSwipeFeedback) showSwipeFeedback(direction);
  if (effect === "next" && session.currentIndex === session.cardOrderIds.length - 1) {
    studySessionPageStore.setState((state) => ({
      pageState: { ...state.pageState, completion: { cardCount: session.cardOrderIds.length } },
    }));
  } else if (preferences.appearance.hideBodyWhenCardChanged) hideBackText();
  return true;
}
