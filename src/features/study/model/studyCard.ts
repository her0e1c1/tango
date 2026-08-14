import type { Card } from "@/entities/card";
import { createStudyProgressFromCard, type StudyProgress } from "@/entities/study-progress";

type StudyCardContent = Omit<Card, keyof Omit<StudyProgress, "cardId" | "uid">>;

export interface StudyCard<TCard extends StudyCardContent = StudyCardContent> {
  card: TCard;
  progress: StudyProgress;
}

export const createStudyCard = <TCard extends Card>(card: TCard): StudyCard<TCard> => ({
  card,
  progress: createStudyProgressFromCard({
    id: card.id,
    uid: card.uid,
    score: card.score,
    numberOfSeen: card.numberOfSeen,
    ...(card.lastSeenAt === undefined ? {} : { lastSeenAt: card.lastSeenAt }),
    ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: card.nextSeeingAt }),
    ...(card.interval === undefined ? {} : { interval: card.interval }),
  }),
});
