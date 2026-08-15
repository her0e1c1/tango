import * as lodash from "lodash";

import type { Card } from "@/entities/card";
import type { StudyPreferences } from "@/entities/preferences";
import { compareStudyProgress, createStudyProgressFromCard, type StudyProgress } from "@/entities/study-progress";

interface StudyOrderCard {
  id: Card["id"];
  progress: StudyProgress;
}

const createStudyOrderCard = (card: Card): StudyOrderCard => ({
  id: card.id,
  progress: createStudyProgressFromCard({
    id: card.id,
    score: card.score,
    numberOfSeen: card.numberOfSeen,
    ...(card.lastSeenAt === undefined ? {} : { lastSeenAt: card.lastSeenAt }),
    ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: card.nextSeeingAt }),
    ...(card.interval === undefined ? {} : { interval: card.interval }),
  }),
});

export const buildStudyCardOrder = (
  cards: Card[],
  study: Pick<StudyPreferences, "shuffled" | "maxNumberOfCardsToLearn">
): string[] => {
  // Session start owns the complete order so filtered card consumers do not carry an implicit study-order contract.
  let cardOrderIds = cards
    .map(createStudyOrderCard)
    .sort((first, second) => compareStudyProgress(first.progress, second.progress))
    .map((card) => card.id);
  if (study.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (study.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, study.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
