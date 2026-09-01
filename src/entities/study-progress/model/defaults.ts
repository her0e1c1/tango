import type { CardId } from "@/entities/card/@x/study-progress";
import { DEFAULT_DIFFICULTY } from "./difficulty";
import type { StudyProgress } from "./types";

// Creates neutral learning progress for a Card that has not been studied.
export const createStudyProgress = (cardId: CardId): StudyProgress => ({
  cardId,
  difficulty: DEFAULT_DIFFICULTY,
  numberOfSeen: 0,
});
