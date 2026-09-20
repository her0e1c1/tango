import { getPreferences, type SwipeDirection } from "@/entities/preference";
import { submitStudyAction } from "./submitStudyAction";

export async function swipeCard(uid: string, deckId: string, direction: SwipeDirection): Promise<void> {
  await submitStudyAction(uid, deckId, getPreferences().controls[direction], direction);
}
