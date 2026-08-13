import type { CardId } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { studyProgressCommands, type StudyProgressEdit } from "@/entities/study-progress";

import { useSession } from "@/entities/session";
import { useAsyncAction } from "@/shared/hooks";

export const useStudyProgressMutations = (deckId: DeckId) => {
  const auth = useSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<CardId>(uid);

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
