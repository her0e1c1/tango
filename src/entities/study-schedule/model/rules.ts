import { z } from "zod";
import { createEmptyCard, fsrs, Rating, State, type Card } from "ts-fsrs";
import type { StudyRating } from "@/entities/study-answer/@x/study-schedule";
import { instantSchema, studyScheduleSchema, type StudySchedule, type studyScheduleFieldsSchema } from "./schema";

export type StudyScheduleFields = z.infer<typeof studyScheduleFieldsSchema>;

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
    lastReviewedAt: answeredAt,
    reps: card.reps,
    lapses: card.lapses,
    elapsedDays: z.object({ elapsed_days: z.number() }).parse(card).elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  });
}

// A malformed state is an error, never a new card; a valid FSRS schedule supersedes legacy fields.
export function classifyStudySchedule(
  timing: StudyScheduleFields,
  now: number
): { status: "new" } | { status: "due" | "future"; dueAt: number } {
  const dueAt =
    timing.schedule !== undefined
      ? studyScheduleSchema.parse(timing.schedule).dueAt
      : timing.nextSeeingAt === undefined
        ? undefined
        : z.date().parse(timing.nextSeeingAt).getTime();
  if (dueAt === undefined) return { status: "new" };
  return { status: dueAt <= now ? "due" : "future", dueAt };
}

export const studyRetentionTarget = scheduler.parameters.request_retention;

export function getStudyRetrievability(schedule: StudySchedule, at: number): number {
  const saved = studyScheduleSchema.parse(schedule);
  // get_retrievability rounds elapsed time to whole days in ts-fsrs 5.4.2.
  const elapsedDays = Math.max(0, instantSchema.parse(at) - saved.lastReviewedAt) / 86_400_000;
  return scheduler.forgetting_curve(elapsedDays, saved.stability);
}
