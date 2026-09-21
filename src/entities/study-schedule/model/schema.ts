import { z } from "zod";

// Version 1 stores FSRS-6.0 state from pinned ts-fsrs 5.4.2; all instants are Unix milliseconds.
export const instantSchema = z.number().int().nonnegative().max(253402300799999);
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

// Legacy deadlines remain readable until the first FSRS rating replaces them.
export const studyScheduleFieldsSchema = z.object({
  schedule: studyScheduleSchema.optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});
