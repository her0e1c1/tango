import { z } from "zod";
import { studyRatingSchema, type StudyRating } from "@/entities/study-progress";
import { firestoreMetadataSchema, firestoreTimestampSchema } from "@/shared/api";

type RatingAnswer = { type: "rating"; rating: StudyRating };
type Answer = RatingAnswer;
export type AnswerType = Answer["type"];

const ratingAnswerSchema: z.ZodType<Answer> = z
  .object({
    type: z.literal("rating"),
    rating: studyRatingSchema,
  })
  .strict();

export const studyAnswerDocumentSchema = firestoreMetadataSchema
  .extend({
    uid: z.string().min(1),
    sessionId: z.string().min(1),
    deckId: z.string().min(1),
    cardId: z.string().min(1),
    answer: ratingAnswerSchema,
    answeredAt: firestoreTimestampSchema,
  })
  .strict();

export type StudyAnswerDocument = z.infer<typeof studyAnswerDocumentSchema>;
