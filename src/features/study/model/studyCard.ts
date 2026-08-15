import type { Card } from "@/entities/card";
import type { StudyProgress } from "@/entities/study-progress";

export interface StudyCard<TCard extends Card = Card> {
  card: TCard;
  progress: StudyProgress;
}

export const createStudyCard = <TCard extends Card>(card: TCard, progress: StudyProgress): StudyCard<TCard> => ({
  card,
  progress,
});
