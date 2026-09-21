import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { submitStudyAction } from "./submitStudyAction";

export async function swipeCard(deckId: string, direction: SwipeDirection): Promise<void> {
  await submitStudyAction(deckId, getPreferences().controls[direction], direction);
}
