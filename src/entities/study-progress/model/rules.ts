import * as lodash from "lodash";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import { createStudyProgress } from "./defaults";
import type {
  CardProgressFields,
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressEdit,
  StudyProgressFilter,
  StudyRating,
} from "./types";

const resolveStudyRating = (swipeAction: SwipeAction): StudyRating => {
  if (swipeAction === "GoToNextCardMastered") return "mastered";
  // Toggle remains a negative rating because changing this mapping would alter the existing persisted-score behavior.
  if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return "not-mastered";
  }
  return "unrated";
};

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
  // Score records rating direction as a streak; reversing direction must pass through neutral zero.
  if (rating === "mastered") return score >= 0 ? score + 1 : 0;
  if (rating === "not-mastered") return score <= 0 ? score - 1 : 0;
  return score;
};

const recordStudyProgress = (progress: StudyProgress, rating: StudyRating, studiedAt: number): StudyProgressEdit => ({
  cardId: progress.cardId,
  score: calculateScore(progress.score, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

export const recordCardStudyProgress = (
  card: CardProgressFields,
  swipeAction: SwipeAction,
  studiedAt: number
): StudyProgressEdit =>
  recordStudyProgress(createStudyProgressFromCard(card), resolveStudyRating(swipeAction), studiedAt);

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
  // Least-seen Cards lead; stable sorting preserves caller order for ties until optional shuffling.
  let cardOrderIds = cards
    .map(createStudyProgressFromCard)
    .sort(compareStudyProgress)
    .map((progress) => progress.cardId);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
