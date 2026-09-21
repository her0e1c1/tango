import { z } from "zod";
import { createEmptyCard, fsrs, Rating, State, type Card } from "ts-fsrs";
import type { StudyRating } from "./types";

// Version 1 stores FSRS-6.0 state from pinned ts-fsrs 5.4.2; all instants are Unix milliseconds.
const instantSchema = z.number().int().nonnegative().max(253402300799999);
export const studyScheduleSchema = z
  .object({
    version: z.literal(1),
    state: z.enum(["learning", "review", "relearning"]),
    dueAt: instantSchema,
    stability: z.number().positive(),
    difficulty: z.number().min(1).max(10),
    lastReviewedAt: instantSchema,
    reps: z.number().int().positive(),
    lapses: z.number().int().nonnegative(),
    elapsedDays: z.number().nonnegative(),
    scheduledDays: z.number().nonnegative().max(36500),
    learningSteps: z.number().int().nonnegative(),
  })
  .strict()
  .refine((schedule) => schedule.lapses <= schedule.reps, "Lapses cannot exceed reviews");

export type StudySchedule = z.infer<typeof studyScheduleSchema>;

const scheduler = fsrs({
  request_retention: 0.9,
  enable_fuzz: false,
  maximum_interval: 36500,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"],
});
const ratings = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const;
const states = { learning: State.Learning, review: State.Review, relearning: State.Relearning } as const;

function restoreCard(schedule: StudySchedule): Card {
  const saved = studyScheduleSchema.parse(schedule);
  return {
    due: new Date(saved.dueAt),
    stability: saved.stability,
    difficulty: saved.difficulty,
    elapsed_days: saved.elapsedDays,
    scheduled_days: saved.scheduledDays,
    learning_steps: saved.learningSteps,
    reps: saved.reps,
    lapses: saved.lapses,
    state: states[saved.state],
    last_review: new Date(saved.lastReviewedAt),
  };
}

export function calculateStudySchedule(
  schedule: StudySchedule | undefined,
  rating: StudyRating,
  answeredAt: number
): StudySchedule {
  const now = new Date(instantSchema.parse(answeredAt));
  const previous = schedule === undefined ? createEmptyCard(now) : restoreCard(schedule);
  const { card } = scheduler.next(previous, now, ratings[rating]);
  return studyScheduleSchema.parse({
    version: 1,
    state: card.state === State.Learning ? "learning" : card.state === State.Review ? "review" : "relearning",
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    lastReviewedAt: card.last_review?.getTime(),
    reps: card.reps,
    lapses: card.lapses,
    elapsedDays: z.object({ elapsed_days: z.number() }).parse(card).elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  });
}
