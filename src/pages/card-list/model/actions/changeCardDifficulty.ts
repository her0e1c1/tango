import { type Card, type CardId, mustFindCardById } from "@/entities/card";
import { calculateDifficulty, editStudyProgress, type StudyRating } from "@/entities/study-progress";
import { showToast } from "@/shared/ui/toast";
import type { ListMutationControl } from "../types";
import { beginListMutation } from "./beginListMutation";
import { finishListMutation } from "./finishListMutation";

interface ChangeCardDifficultyOptions {
  uid: string;
  cards: readonly Card[];
  id: CardId;
  rating: StudyRating;
  mutation: ListMutationControl;
}

export const changeCardDifficulty = async ({
  uid,
  cards,
  id,
  rating,
  mutation,
}: ChangeCardDifficultyOptions): Promise<void> => {
  if (!beginListMutation(mutation)) return;
  try {
    const card = mustFindCardById(cards, id);
    await editStudyProgress(uid, { cardId: card.id, difficulty: calculateDifficulty(card.difficulty, rating) });
  } catch {
    if (mutation.isMounted())
      mutation.errorToastId.current = showToast({ messageKey: "toast.saveFailure", tone: "error" });
  } finally {
    finishListMutation(mutation);
  }
};
