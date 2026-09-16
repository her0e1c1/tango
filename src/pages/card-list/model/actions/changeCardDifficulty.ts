import { getAuthUid } from "@/entities/auth";
import { type CardId, getCards, mustFindCardById } from "@/entities/card";
import { calculateDifficulty, editStudyProgress, type StudyRating } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import { cardListStore } from "../store";

export async function changeCardDifficulty(cardId: CardId, rating: StudyRating): Promise<void> {
  if (cardListStore.getState().mutationId !== undefined) return;
  const mutationId = Symbol();
  cardListStore.setState({ mutationId });
  try {
    const uid = getAuthUid();
    const card = mustFindCardById(getCards(), cardId);
    await editStudyProgress(uid, { cardId: card.id, difficulty: calculateDifficulty(card.difficulty, rating) });
  } catch {
    if (cardListStore.getState().mutationId === mutationId)
      showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    // A reset detaches pending writes; their completion must not unlock a newer mutation.
    if (cardListStore.getState().mutationId === mutationId) {
      cardListStore.setState({ mutationId: undefined });
    }
  }
}
