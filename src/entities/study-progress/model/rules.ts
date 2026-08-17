import * as lodash from "lodash";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import type {
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressEdit,
  StudyProgressFilter,
  StudyRating,
} from "./types";

// Converts a control action into its learning outcome; navigation-only actions remain unrated.
const resolveStudyRating = (swipeAction: SwipeAction): StudyRating => {
  if (swipeAction === "GoToNextCardMastered") return "mastered";
  // Toggle remains a negative rating because changing this mapping would alter the existing persisted-score behavior.
  if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return "not-mastered";
  }
  return "unrated";
};

// Updates the signed rating streak; reversing direction passes through zero and an unrated action leaves it unchanged.
const calculateScore = (score: number, rating: StudyRating): number => {
  if (rating === "mastered") return score >= 0 ? score + 1 : 0;
  if (rating === "not-mastered") return score <= 0 ? score - 1 : 0;
  return score;
};

// Builds the persistence patch for one interaction, which always increments the seen count and records its timestamp.
const buildStudyProgressEdit = (
  progress: StudyProgress,
  rating: StudyRating,
  studiedAt: number
): StudyProgressEdit => ({
  cardId: progress.cardId,
  score: calculateScore(progress.score, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

// Translates one interaction into the persistence patch owned by StudyProgress.
export const recordStudyProgress = (
  progress: StudyProgress,
  swipeAction: SwipeAction,
  studiedAt: number
): StudyProgressEdit => buildStudyProgressEdit(progress, resolveStudyRating(swipeAction), studiedAt);

// Accepts progress inside the inclusive score bounds and, when enabled, only after its next scheduled time.
export const isStudyProgressEligible = (progress: StudyProgress, filter: StudyProgressFilter, now: number): boolean => {
  if (filter.maximumScore != null && progress.score > filter.maximumScore) return false;
  if (filter.minimumScore != null && progress.score < filter.minimumScore) return false;
  if (filter.respectNextSeeingAt && progress.nextSeeingAt != null && progress.nextSeeingAt.getTime() > now) {
    return false;
  }
  return true;
};

// Orders progress from least to most seen; equal counts deliberately defer to the stable input order.
const compareStudyProgress = (first: StudyProgress, second: StudyProgress): number =>
  first.numberOfSeen - second.numberOfSeen;

// Builds a least-seen-first Card order, optionally shuffling the full set before applying a positive session limit.
export const buildStudyCardOrder = (
  progresses: StudyProgress[],
  options: StudyCardOrderOptions
): StudyProgress["cardId"][] => {
  let cardOrderIds = [...progresses].sort(compareStudyProgress).map((progress) => progress.cardId);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
