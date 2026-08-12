import type { CardId } from "@/entities/card/@x/study-progress";

export interface StudyProgress {
  cardId: CardId;
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number;
}

export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

export const createStudyProgress = (cardId: CardId): StudyProgress => ({
  cardId,
  score: 0,
  numberOfSeen: 0,
});
