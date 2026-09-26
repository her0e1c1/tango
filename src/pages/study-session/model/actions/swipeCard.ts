import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { submitStudyAction } from "./submitStudyAction";

export function swipeCard(deckId: string, direction: SwipeDirection): Promise<boolean> {
  return submitStudyAction(deckId, getPreferences().controls[direction], direction);
}
