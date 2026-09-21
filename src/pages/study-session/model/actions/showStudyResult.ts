import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { showSwipeFeedback } from "../../lib/showSwipeFeedback";
import { studySessionPageStore } from "../store";
import { hideBackText } from "./hideBackText";

export function showStudyResult(completed: boolean, cardCount: number, direction: SwipeDirection | undefined): void {
  const preferences = getPreferences();
  if (preferences.appearance.showSwipeFeedback && direction !== undefined) showSwipeFeedback(direction);
  if (completed) {
    studySessionPageStore.setState((state) => ({ pageState: { ...state.pageState, completion: { cardCount } } }));
  } else if (preferences.appearance.hideBodyWhenCardChanged) hideBackText();
}
