import * as lodash from "lodash";

import { createStudyProgress } from "./defaults";
import { clampDifficulty, type Difficulty } from "./difficulty";
import type {
  CardProgressFields,
  StudyCardOrderOptions,
  StudyProgress,
  StudyProgressFilter,
  StudyRating,
} from "./types";

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

// Keep the existing binary difficulty rule, not FSRS scheduling; Hard/Good/Easy all indicate successful recall.
export const calculateDifficulty = (difficulty: Difficulty, rating: StudyRating | undefined): Difficulty => {
  if (rating === undefined) return difficulty;
  return clampDifficulty(difficulty + (rating === "again" ? 1 : -1));
};

// Builds the persistence patch for one interaction, which always increments the seen count and records its timestamp.
const recordStudyProgress = (progress: StudyProgress, rating: StudyRating | undefined, studiedAt: number) => ({
  cardId: progress.cardId,
  difficulty: calculateDifficulty(progress.difficulty, rating),
  numberOfSeen: progress.numberOfSeen + 1,
  lastSeenAt: studiedAt,
});

// Translates a studied Card and its rating into the progress patch owned by the StudyProgress Entity.
export const recordCardStudyProgress = (card: CardProgressFields, rating: StudyRating | undefined, studiedAt: number) =>
  recordStudyProgress(createStudyProgressFromCard(card), rating, studiedAt);

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
