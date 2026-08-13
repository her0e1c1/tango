import type { CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { studyProgressCommands, type StudyProgressEdit } from "@/entities/study-progress";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";

export const useStudyProgressMutations = (deckId: DeckId) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<CardId>(`${uid}:${deckId}`);

  const update = (progress: StudyProgressEdit) =>
    mutation.run([progress.cardId], `update:${progress.cardId}`, () =>
      studyProgressCommands.update(uid, deckId, progress)
    );

  return {
    update,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
