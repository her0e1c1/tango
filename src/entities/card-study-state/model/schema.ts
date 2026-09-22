import { z } from "zod";

// FSRS-6.0 state from pinned ts-fsrs 5.4.2; all instants are Unix milliseconds.
export const instantSchema = z.number().int().nonnegative().max(253_402_300_799_999);
export const fsrsStateSchema = z
  .object({
    state: z.enum(["learning", "review", "relearning"]),
    dueAt: instantSchema,
    stability: z.number().positive(),
    difficulty: z.number().min(1).max(10),
    lastReviewedAt: instantSchema,
    reps: z.number().int().positive(),
    lapses: z.number().int().nonnegative(),
    scheduledDays: z.number().nonnegative().max(36_500),
    learningSteps: z.number().int().nonnegative(),
  })
  .strict()
  .refine((schedule) => schedule.lapses <= schedule.reps, "Lapses cannot exceed reviews");

export type FsrsState = z.infer<typeof fsrsStateSchema>;
