import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote StudyProgress writes");

const studyProgressEditSchema = z.object({
  cardId: z.string().min(1, "Card id is required"),
  score: z.number().optional(),
  numberOfSeen: z.number().optional(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});

export const editStudyProgressSchema = z.object({
  uid: authenticatedUidSchema,
  progress: studyProgressEditSchema,
});
