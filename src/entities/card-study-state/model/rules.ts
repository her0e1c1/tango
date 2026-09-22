import type { Card } from "@/entities/card/@x/card-study-state";
import { createEmptyCard, fsrs as createScheduler, Rating, State, type Card as FsrsCard } from "ts-fsrs";
import type { StudyRating } from "@/entities/study-answer/@x/card-study-state";
import { instantSchema, fsrsStateSchema, type FsrsState } from "./schema";

const scheduler = createScheduler({
  request_retention: 0.9,
  enable_fuzz: false,
  maximum_interval: 36_500,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"],
});
const ratings = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const;
const libraryStates = { learning: State.Learning, review: State.Review, relearning: State.Relearning } as const;

function restoreCard(schedule: FsrsState): FsrsCard {
  const saved = fsrsStateSchema.parse(schedule);
  return {
    due: new Date(saved.dueAt),
    stability: saved.stability,
    difficulty: saved.difficulty,
    elapsed_days: 0,
    scheduled_days: saved.scheduledDays,
    learning_steps: saved.learningSteps,
    reps: saved.reps,
    lapses: saved.lapses,
    state: libraryStates[saved.state],
    last_review: new Date(saved.lastReviewedAt),
  };
}

export function calculateFsrsState(schedule: FsrsState | null, rating: StudyRating, answeredAt: number): FsrsState {
  const now = new Date(instantSchema.parse(answeredAt));
  const previous = schedule === null ? createEmptyCard(now) : restoreCard(schedule);
  const { card } = scheduler.next(previous, now, ratings[rating]);
  return fsrsStateSchema.parse({
    state: card.state === State.Learning ? "learning" : card.state === State.Review ? "review" : "relearning",
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    lastReviewedAt: answeredAt,
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  });
}

// Missing documents and explicit null both represent an unrated card.
export function classifyFsrsState(
  fsrs: FsrsState | null,
  now: number
): { status: "new" } | { status: "due" | "future"; dueAt: number } {
  if (fsrs === null) return { status: "new" };
  const { dueAt } = fsrsStateSchema.parse(fsrs);
  return { status: dueAt <= now ? "due" : "future", dueAt };
}

export const studyRetentionTarget = scheduler.parameters.request_retention;

export function getStudyRetrievability(schedule: FsrsState, at: number): number {
  const saved = fsrsStateSchema.parse(schedule);
  // get_retrievability rounds elapsed time to whole days in ts-fsrs 5.4.2.
  const elapsedDays = Math.max(0, instantSchema.parse(at) - saved.lastReviewedAt) / 86_400_000;
  return scheduler.forgetting_curve(elapsedDays, saved.stability);
}

export function joinStudyCards(
  cards: readonly Card[],
  states: Readonly<Partial<Record<Card["id"], { fsrs: FsrsState | null }>>>
) {
  return cards.map((card) => ({ ...card, fsrs: states[card.id]?.fsrs ?? null }));
}
