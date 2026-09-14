import type { Card } from "@/entities/card";
import { calculateDifficulty, editStudyProgress, type StudyRating } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import type { CardListStore } from "../store";
import { dismissListError } from "./dismissListError";

export async function changeCardDifficulty(
  store: CardListStore,
  uid: string,
  card: Card,
  rating: StudyRating
): Promise<void> {
  if (store.getState().mutationPending) return;
  dismissListError(store);
  store.setState({ mutationPending: true });
  try {
    await editStudyProgress(uid, { cardId: card.id, difficulty: calculateDifficulty(card.difficulty, rating) });
  } catch {
    if (store.getState().active)
      store.setState({ errorToastId: showToast({ messageKey: "toast.saveFailure", tone: "error" }) });
  } finally {
    store.setState({ mutationPending: false });
  }
}
