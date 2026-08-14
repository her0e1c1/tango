import type { CardId } from "@/entities/card/@x/study-progress";
import type { StudyProgress } from "./types";

export const createStudyProgress = (cardId: CardId): StudyProgress => ({
  cardId,
  score: 0,
  numberOfSeen: 0,
});
