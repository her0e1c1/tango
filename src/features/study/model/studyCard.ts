import type { Card } from "@/entities/card";
import { createStudyProgressFromCard, type StudyProgress } from "@/entities/study-progress";

type StudyCardContent = Omit<Card, keyof Omit<StudyProgress, "cardId">>;

export interface StudyCard<TCard extends StudyCardContent = StudyCardContent> {
  card: TCard;
  progress: StudyProgress;
}

export const createStudyCard = <TCard extends Card>(card: TCard): StudyCard<TCard> => ({
  card,
  progress: createStudyProgressFromCard(card),
});
