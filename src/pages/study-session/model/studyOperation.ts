import { z } from "zod";
import { studyRatingSchema } from "@/entities/study-progress";

export const studyOperationSchema = z
  .object({
    id: z.string().min(1),
    uid: z.string(),
    sessionId: z.string().min(1),
    deckId: z.string().min(1),
    cardId: z.string().min(1),
    currentIndex: z.number().int().nonnegative(),
    targetIndex: z.number().int().positive(),
    cardCount: z.number().int().positive(),
    answeredAt: z.number().nonnegative(),
    rating: studyRatingSchema.optional(),
    recordProgress: z.boolean(),
    direction: z.enum(["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"]).optional(),
  })
  .strict()
  .refine(
    (operation) =>
      operation.targetIndex > operation.currentIndex &&
      operation.targetIndex <= operation.cardCount &&
      (operation.rating === undefined ||
        (operation.recordProgress && operation.targetIndex === operation.currentIndex + 1))
  );

export type StudyOperation = z.infer<typeof studyOperationSchema>;
