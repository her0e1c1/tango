import type { CardId } from "@/entities/card/@x/study-progress";
import type { StudyProgress } from "./types";

// Creates neutral learning progress for a Card that has not been studied.
export const createStudyProgress = (cardId: CardId): StudyProgress => ({
  cardId,
  score: 0,
  numberOfSeen: 0,
});
