import { z } from "zod";
import { difficultySchema } from "./difficulty";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote StudyProgress writes");

export const studyProgressEditSchema = z.object({
  cardId: z.string().min(1, "Card id is required"),
  difficulty: difficultySchema.optional(),
});

export const editStudyProgressSchema = z.object({
  uid: authenticatedUidSchema,
  progress: studyProgressEditSchema,
});

const identity = z
  .string()
  .min(1)
  .max(1500)
  .refine((value) => !value.includes("/") && value !== "." && value !== "..", "Invalid identity");
const timeZone = z
  .string()
  .min(1)
  .refine((value) => {
    try {
      Intl.DateTimeFormat("en", { timeZone: value }).resolvedOptions();
      return true;
    } catch {
      return false;
    }
  }, "Invalid time zone");

const studyRatingSchema = z.enum(["again", "hard", "good", "easy"]);
export type StudyRating = z.infer<typeof studyRatingSchema>;

export function studyLocalDate(answeredAt: Date, zone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit" }).format(
    answeredAt
  );
}

const fields = z.strictObject({
  operationId: identity,
  sessionId: identity,
  deckId: identity,
  cardId: identity,
  rating: studyRatingSchema,
  answeredAt: z.date().min(new Date(0)).max(new Date(253_402_300_799_999)),
  localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone,
  schemaVersion: z.literal(1),
});

function hasMatchingDate(value: { answeredAt: Date; localDate: string; timeZone: string }): boolean {
  try {
    return value.localDate === studyLocalDate(value.answeredAt, value.timeZone);
  } catch {
    return false;
  }
}

export const studyAttemptInputSchema = fields.refine(hasMatchingDate, "Local date does not match the answer time");
export const studyAttemptSchema = fields
  .extend({ uid: z.string().min(1) })
  .refine(hasMatchingDate, "Local date does not match the answer time");
export type StudyAttemptInput = z.infer<typeof studyAttemptInputSchema>;
export type StudyAttempt = z.infer<typeof studyAttemptSchema>;

export const persistedStudyAttemptSchema = fields
  .extend({
    uid: z.string().min(1),
    answeredAt: z.iso.datetime().transform((value) => new Date(value)),
  })
  .pipe(studyAttemptSchema);
