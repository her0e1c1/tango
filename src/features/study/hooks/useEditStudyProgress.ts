import type { Card } from "@/entities/card";
import type { StudyProgressEdit } from "@/entities/study-progress";

import { useAuthSession } from "@/entities/auth";
export type StudyProgressPatch = Omit<StudyProgressEdit, "cardId">;

type EditStudyProgress = (uid: string, progress: StudyProgressEdit) => Promise<void>;

export const useEditStudyProgress = (editStudyProgress?: EditStudyProgress) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const update = (progress: StudyProgressEdit) =>
    editStudyProgress == null
      ? Promise.reject(new Error("Study progress editing is unavailable"))
      : editStudyProgress(uid, progress);

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => StudyProgressPatch) =>
      update({ ...buildPatch(card), cardId: card.id }),
  };
};
