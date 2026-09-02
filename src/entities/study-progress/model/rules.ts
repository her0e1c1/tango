import * as lodash from "lodash";

import type { SwipeAction } from "@/entities/preference/@x/study-progress";

import { createStudyProgress } from "./defaults";
import { clampDifficulty, type Difficulty } from "./difficulty";
import type {
  CardProgressFields,
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressEdit,
  StudyProgressFilter,
  StudyRating,
} from "./types";

// Converts a control action into its learning outcome; navigation-only actions remain unrated.
const resolveStudyRating = (swipeAction: SwipeAction): StudyRating => {
  if (swipeAction === "GoToNextCardMastered") return "mastered";
  // Toggle remains a not-mastered rating because changing this mapping would alter existing study controls.
  if (swipeAction === "GoToNextCardNotMastered" || swipeAction === "GoToNextCardToggleMastered") {
    return "not-mastered";
  }
  return "unrated";
};

// Projects a Card's learning fields into StudyProgress while preserving which optional fields are absent.
export const createStudyProgressFromCard = (card: CardProgressFields): StudyProgress => {
  const progress = createStudyProgress(card.id);
  progress.difficulty = card.difficulty;
  progress.numberOfSeen = card.numberOfSeen;
  if (card.lastSeenAt !== undefined) progress.lastSeenAt = card.lastSeenAt;
  if (card.nextSeeingAt !== undefined) progress.nextSeeingAt = card.nextSeeingAt;
  if (card.interval !== undefined) progress.interval = card.interval;
  return progress;
};

// Applies at most one step per rating without resetting when the rating direction changes.
export const calculateDifficulty = (difficulty: Difficulty, rating: StudyRating): Difficulty => {
  if (rating === "mastered") return clampDifficulty(difficulty - 1);
  if (rating === "not-mastered") return clampDifficulty(difficulty + 1);
  return difficulty;
};

// Builds the persistence patch for one interaction, which always increments the seen count and records its timestamp.
const recordStudyProgress = (progress: StudyProgress, rating: StudyRating, studiedAt: number): StudyProgressEdit => ({
  cardId: progress.cardId,
  difficulty: calculateDifficulty(progress.difficulty, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

// Translates a studied Card and its control action into the progress patch owned by the StudyProgress Entity.
export const recordCardStudyProgress = (
  card: CardProgressFields,
  swipeAction: SwipeAction,
  studiedAt: number
): StudyProgressEdit =>
  recordStudyProgress(createStudyProgressFromCard(card), resolveStudyRating(swipeAction), studiedAt);

// Accepts progress inside the inclusive difficulty bounds and, when enabled, only after its next scheduled time.
export const isStudyProgressEligible = (progress: StudyProgress, filter: StudyProgressFilter, now: number): boolean => {
  if (filter.maximumDifficulty != null && progress.difficulty > filter.maximumDifficulty) return false;
  if (filter.minimumDifficulty != null && progress.difficulty < filter.minimumDifficulty) return false;
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
  cards: CardProgressFields[],
  options: StudyCardOrderOptions
): StudyProgress["cardId"][] => {
  let cardOrderIds = cards
    .map(createStudyProgressFromCard)
    .sort(compareStudyProgress)
    .map((progress) => progress.cardId);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
