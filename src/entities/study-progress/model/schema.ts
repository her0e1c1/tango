import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote StudyProgress writes");

export const studyProgressSchema = z.object({
  cardId: z.string().min(1, "Card id is required"),
  score: z.number(),
  numberOfSeen: z.number(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});

export const studyProgressEditSchema = studyProgressSchema.partial().required({ cardId: true });

export const editStudyProgressSchema = z.object({
  uid: authenticatedUidSchema,
  progress: studyProgressEditSchema,
});

const persistedDateSchema = z.preprocess(
  (value) => (typeof value === "string" ? new Date(value) : value),
  z.date().refine((value) => !Number.isNaN(value.getTime()), "Invalid date")
);

export const persistedStudyProgressSchema = studyProgressSchema.extend({
  nextSeeingAt: persistedDateSchema.optional(),
});
