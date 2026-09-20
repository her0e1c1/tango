import { submitStudyAction } from "./submitStudyAction";

export async function skipCard(uid: string, deckId: string): Promise<void> {
  await submitStudyAction(uid, deckId, "GoToNextCard");
}
