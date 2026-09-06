import type { Card } from "@/entities/card";
import type { Difficulty } from "@/entities/study-progress";
import type { BulkDifficultyRequest, ListMutationControl } from "../types";
import { dismissListError } from "./dismissListError";

export const requestBulkDifficulty = (
  cards: readonly Card[],
  difficulty: Difficulty | null,
  mutation: ListMutationControl,
  setRequest: (request: BulkDifficultyRequest) => void
): void => {
  if (difficulty == null || cards.length === 0 || mutation.pendingRef.current) return;
  dismissListError(mutation.errorToastId);
  // Freeze the visible result set so filter updates cannot change the approved targets.
  setRequest({ cardIds: cards.map(({ id }) => id), difficulty });
};
