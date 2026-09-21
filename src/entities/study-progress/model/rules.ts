import { z } from "zod";
import { calculateStudySchedule, studyScheduleSchema } from "./schedule";
import * as lodash from "lodash";

import { createStudyProgress } from "./defaults";
import { clampDifficulty, type Difficulty } from "./difficulty";
import type { CardProgressFields, StudyCardOrderOptions, StudyProgress, StudyRating } from "./types";

// Projects a Card's learning fields into StudyProgress while preserving which optional fields are absent.
export const createStudyProgressFromCard = (card: CardProgressFields): StudyProgress => {
  const progress = createStudyProgress(card.id);
  progress.difficulty = card.difficulty;
  progress.numberOfSeen = card.numberOfSeen;
  if (card.lastSeenAt !== undefined) progress.lastSeenAt = card.lastSeenAt;
  if (card.nextSeeingAt !== undefined) progress.nextSeeingAt = card.nextSeeingAt;
  if (card.interval !== undefined) progress.interval = card.interval;
  if (card.schedule !== undefined) progress.schedule = card.schedule;
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
  ...(rating === undefined ? {} : { schedule: calculateStudySchedule(progress.schedule, rating, studiedAt) }),
});

// A malformed state is an error, never a new card; a valid FSRS schedule supersedes legacy fields.
export function classifyStudyProgress(
  progress: StudyProgress,
  now: number
): { status: "new" } | { status: "due" | "future"; dueAt: number } {
  const dueAt =
    progress.schedule !== undefined
      ? studyScheduleSchema.parse(progress.schedule).dueAt
      : progress.nextSeeingAt === undefined
        ? undefined
        : z.date().parse(progress.nextSeeingAt).getTime();
  if (dueAt === undefined) return { status: "new" };
  return { status: dueAt <= now ? "due" : "future", dueAt };
}

// Translates a studied Card and its rating into the progress patch owned by the StudyProgress Entity.
export const recordCardStudyProgress = (
  card: CardProgressFields,
  rating: StudyRating | undefined,
  studiedAt: number
) => {
  const progress = createStudyProgressFromCard(card);
  classifyStudyProgress(progress, studiedAt);
  return recordStudyProgress(progress, rating, studiedAt);
};

// Orders progress from least to most seen; equal counts deliberately defer to the stable input order.
const compareStudyProgress = (first: StudyProgress, second: StudyProgress): number =>
  first.numberOfSeen - second.numberOfSeen;

// Builds a least-seen-first Card order, optionally shuffling the full set before applying a positive session limit.
export const buildStudyCardOrder = (
  cards: CardProgressFields[],
  options: StudyCardOrderOptions,
  now = Date.now()
): StudyProgress["cardId"][] => {
  if (options.useCardInterval) {
    const selected = cards
      .map((card) => ({ card, timing: classifyStudyProgress(createStudyProgressFromCard(card), now) }))
      .filter(({ timing }) => timing.status !== "future")
      .sort((a, b) => {
        if (a.timing.status === "new") return b.timing.status === "new" ? 0 : 1;
        if (b.timing.status === "new") return -1;
        return a.timing.dueAt - b.timing.dueAt;
      })
      .map(({ card }) => card.id);
    const limited = options.maxNumberOfCardsToLearn > 0 ? selected.slice(0, options.maxNumberOfCardsToLearn) : selected;
    return options.shuffled ? lodash.shuffle(limited) : limited;
  }
  let cardOrderIds = cards
    .map(createStudyProgressFromCard)
    .sort(compareStudyProgress)
    .map((progress) => progress.cardId);
  // The maximum follows shuffling so a limited randomized session can draw from the complete card set.
  if (options.shuffled) cardOrderIds = lodash.shuffle(cardOrderIds);
  if (options.maxNumberOfCardsToLearn > 0) cardOrderIds = cardOrderIds.slice(0, options.maxNumberOfCardsToLearn);
  return cardOrderIds;
};
