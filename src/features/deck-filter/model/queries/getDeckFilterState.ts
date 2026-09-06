import { MAX_DIFFICULTY, MIN_DIFFICULTY } from "@/entities/study-progress";
import type { DeckFilterDraft } from "../types";

export const getDeckFilterState = (state: DeckFilterDraft) => ({
  difficultyLowerBound: MIN_DIFFICULTY,
  ...state.draft,
  difficultyUpperBound: MAX_DIFFICULTY,
  saving: state.pending !== undefined,
});
