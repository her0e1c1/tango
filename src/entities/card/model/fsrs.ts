import { z } from "zod";

// FSRS-6.0 state from pinned ts-fsrs 5.4.2; all instants are Unix milliseconds.
export const instantSchema = z.number().int().nonnegative().max(253_402_300_799_999);
export const fsrsStateSchema = z
  .object({
    /** Current scheduling phase after a review. */
    state: z.enum(["learning", "review", "relearning"]),
    /** Next review time in Unix milliseconds. */
    dueAt: instantSchema,
    /** Positive memory stability in days. */
    stability: z.number().positive(),
    /** Memory difficulty from 1 through 10. */
    difficulty: z.number().min(1).max(10),
    /** Most recent review time in Unix milliseconds. */
    lastReviewedAt: instantSchema,
    /** Positive integer count of completed reviews. */
    reps: z.number().int().positive(),
    /** Non-negative integer lapse count, no greater than reps. */
    lapses: z.number().int().nonnegative(),
    /** Scheduled interval in days, from 0 through 36,500. */
    scheduledDays: z.number().nonnegative().max(36_500),
    /** Non-negative integer index of the learning step. */
    learningSteps: z.number().int().nonnegative(),
  })
  .strict()
  .refine((schedule) => schedule.lapses <= schedule.reps, "Lapses cannot exceed reviews");

export type FsrsState = z.infer<typeof fsrsStateSchema>;
