import type { Card } from "@/entities/card";
import { calculateDifficulty, editStudyProgress, type StudyRating } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function changeCardDifficulty(uid: string, card: Card, rating: StudyRating): Promise<void> {
  const { owner, mutationPending } = cardListStore.getState();
  if (owner === undefined || mutationPending) return;
  cardListStore.setState({ mutationPending: true });
  try {
    await editStudyProgress(uid, { cardId: card.id, difficulty: calculateDifficulty(card.difficulty, rating) });
  } catch {
    if (cardListStore.getState().owner === owner) showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    // A previous visit must never release the current visit's mutation lock.
    if (cardListStore.getState().owner === owner) cardListStore.setState({ mutationPending: false });
  }
}
