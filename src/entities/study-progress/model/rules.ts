import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import { createStudyProgress } from "./defaults";
import type { CardProgressFields, StudyProgress, StudyProgressEdit, StudyProgressFilter, StudyRating } from "./types";

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

export const getNextStudyAvailabilityAt = (
  scheduledItems: readonly { nextSeeingAt?: Date | undefined }[],
  now: number
): number | undefined => {
  let next: number | undefined;
  for (const item of scheduledItems) {
    const candidate = item.nextSeeingAt?.getTime();
    if (candidate !== undefined && candidate > now && (next === undefined || candidate < next)) {
      next = candidate;
    }
  }
  return next;
};
