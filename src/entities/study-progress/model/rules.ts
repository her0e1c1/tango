import shuffle from "lodash/shuffle";

import { createStudyProgress } from "./defaults";
import type {
  CardProgressFields,
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressEdit,
  StudyProgressFilter,
  StudyRating,
} from "./types";

export const createStudyProgressFromCard = (card: CardProgressFields): StudyProgress => {
  const progress = createStudyProgress(card.id);
  progress.score = card.score;
  progress.numberOfSeen = card.numberOfSeen;
  if (card.lastSeenAt !== undefined) progress.lastSeenAt = card.lastSeenAt;
  if (card.nextSeeingAt !== undefined) progress.nextSeeingAt = card.nextSeeingAt;
  if (card.interval !== undefined) progress.interval = card.interval;
  return progress;
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

export const buildStudyCardOrder = (
  cards: CardProgressFields[],
  options: StudyCardOrderOptions
): StudyProgress["cardId"][] => {
  let cardOrderIds = cards
    .map(createStudyProgressFromCard)
    .sort(compareStudyProgress)
    .map((progress) => progress.cardId);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};

export const getNextStudyAvailabilityAt = (progresses: StudyProgress[], now: number): number | undefined => {
  let next: number | undefined;
  for (const progress of progresses) {
    const candidate = progress.nextSeeingAt?.getTime();
    if (candidate !== undefined && candidate > now && (next === undefined || candidate < next)) {
      next = candidate;
    }
  }
  return next;
};
