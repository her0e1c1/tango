import { submitStudyAction } from "./submitStudyAction";

export async function skipCard(deckId: string): Promise<void> {
  await submitStudyAction(deckId, "GoToNextCard");
}
