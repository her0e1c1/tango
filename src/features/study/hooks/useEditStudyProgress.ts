import type { Card, CardId } from "@/entities/card";
import type { StudyProgressEdit } from "@/entities/study-progress";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { editStudyProgress } from "../api/editStudyProgress";

export type StudyProgressPatch = Omit<StudyProgressEdit, "cardId">;

export const useEditStudyProgress = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<CardId>(uid);
  const update = (progress: StudyProgressEdit) =>
    mutation.run([progress.cardId], `update-progress:${progress.cardId}`, () => editStudyProgress(uid, progress));

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => StudyProgressPatch) =>
      update({ ...buildPatch(card), cardId: card.id }),
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
