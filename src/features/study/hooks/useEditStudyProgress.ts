import type { Card } from "@/entities/card";
import { editStudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

import { useAuthSession } from "@/entities/auth";

export type StudyProgressPatch = Omit<StudyProgressEdit, "cardId">;

export const useEditStudyProgress = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const update = (progress: StudyProgressEdit) => editStudyProgress(uid, progress);

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => StudyProgressPatch) =>
      update({ ...buildPatch(card), cardId: card.id }),
  };
};
