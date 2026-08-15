import type { Card } from "@/entities/card";
import { editStudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

import { useAuthUid } from "@/entities/auth";

export type StudyProgressPatch = Omit<StudyProgressEdit, "cardId">;

export const useEditStudyProgress = () => {
  const uid = useAuthUid();
  const update = (progress: StudyProgressEdit) => editStudyProgress(uid, progress);

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => StudyProgressPatch) =>
      update({ ...buildPatch(card), cardId: card.id }),
  };
};
