import type { Card } from "@/entities/card";
import type { StudyProgress } from "@/entities/study-progress";

type StudyCardContent = Omit<Card, keyof Omit<StudyProgress, "cardId">>;

export interface StudyCard<TCard extends StudyCardContent = StudyCardContent> {
  card: TCard;
  progress: StudyProgress;
}

export const createStudyCard = <TCard extends Card>(card: TCard, progress: StudyProgress): StudyCard<TCard> => ({
  card,
  progress,
});
