import { z } from "zod";
import { difficultySchema } from "./difficulty";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote StudyProgress writes");

export const studyProgressEditSchema = z.object({
  cardId: z.string().min(1, "Card id is required"),
  difficulty: difficultySchema.optional(),
  numberOfSeen: z.number().optional(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});

export const editStudyProgressSchema = z.object({
  uid: authenticatedUidSchema,
  progress: studyProgressEditSchema,
});
