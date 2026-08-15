import * as lodash from "lodash";

import type { Card } from "@/entities/card/@x/study-progress";
import type {
  StudyCard,
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressEdit,
  StudyProgressFilter,
  StudyRating,
} from "./types";

export const joinCardsWithStudyProgress = <TCard extends Card>(
  cards: TCard[],
  progresses: StudyProgress[]
): StudyCard<TCard>[] => {
  const progressesByCardId = new Map(progresses.map((progress) => [progress.cardId, progress]));
  return cards.flatMap((card) => {
    const progress = progressesByCardId.get(card.id);
    return progress === undefined ? [] : [{ card, progress }];
  });
};

const calculateScore = (score: number, rating: StudyRating): number => {
  if (rating === "mastered") return score >= 0 ? score + 1 : 0;
  if (rating === "not-mastered") return score <= 0 ? score - 1 : 0;
  return score;
};

export const recordStudyProgress = (
  progress: StudyProgress,
  rating: StudyRating,
  studiedAt: number
): StudyProgressEdit => ({
  cardId: progress.cardId,
  score: calculateScore(progress.score, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

export const isStudyProgressEligible = (progress: StudyProgress, filter: StudyProgressFilter, now: number): boolean => {
  if (filter.maximumScore != null && progress.score > filter.maximumScore) return false;
  if (filter.minimumScore != null && progress.score < filter.minimumScore) return false;
  if (filter.respectNextSeeingAt && progress.nextSeeingAt != null && progress.nextSeeingAt.getTime() > now) {
    return false;
  }
  return true;
};

const compareStudyProgress = (first: StudyProgress, second: StudyProgress): number =>
  first.numberOfSeen - second.numberOfSeen;

export const buildStudyCardOrder = (cards: StudyCard[], options: StudyCardOrderOptions): StudyProgress["cardId"][] => {
  let cardOrderIds = [...cards]
    .sort((first, second) => compareStudyProgress(first.progress, second.progress))
    .map(({ card }) => card.id);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};

export const getNextStudyAvailabilityAt = (progresses: StudyProgress[], now: number): number | undefined => {
  let next: number | undefined;
  for (const progress of progresses) {
    const candidate = progress.nextSeeingAt?.getTime();
    if (candidate === undefined || candidate <= now || (next !== undefined && candidate >= next)) continue;
    next = candidate;
  }
  return next;
};
