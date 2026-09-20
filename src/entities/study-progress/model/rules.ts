import * as lodash from "lodash";

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

// Legacy difficulty controls remain distinct from review ratings until the FSRS migration.
export const calculateDifficulty = (difficulty: Difficulty, rating: "mastered" | "not-mastered"): Difficulty =>
  clampDifficulty(difficulty + (rating === "mastered" ? -1 : 1));

// This is the single transition boundary for a rated review; FSRS will replace this legacy adapter.
export function applyStudyRating(progress: StudyProgress, rating: StudyRating, answeredAt: Date): StudyProgressEdit {
  return {
    cardId: progress.cardId,
    difficulty:
      rating === "again"
        ? clampDifficulty(progress.difficulty + 1)
        : rating === "good" || rating === "easy"
          ? clampDifficulty(progress.difficulty - 1)
          : progress.difficulty,
    numberOfSeen: progress.numberOfSeen + 1,
    lastSeenAt: Math.max(answeredAt.getTime(), progress.lastSeenAt ?? answeredAt.getTime()),
  };
}

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

import type { StudyAttempt } from "./schema";

export function assertSameStudyAttempt(existing: StudyAttempt, input: StudyAttempt): void {
  if (
    existing.operationId !== input.operationId ||
    existing.uid !== input.uid ||
    existing.deckId !== input.deckId ||
    existing.cardId !== input.cardId ||
    existing.sessionId !== input.sessionId ||
    existing.rating !== input.rating ||
    existing.answeredAt.getTime() !== input.answeredAt.getTime() ||
    existing.localDate !== input.localDate ||
    existing.timeZone !== input.timeZone
  ) {
    throw new Error("Study operation conflicts with an existing attempt");
  }
}
