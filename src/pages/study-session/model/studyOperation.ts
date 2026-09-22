import { fsrsStateSchema } from "@/entities/card";
import { z } from "zod";
import { studyRatingSchema } from "@/entities/study-answer";

export const studyOperationSchema = z
  .object({
    id: z.string().min(1),
    uid: z.string(),
    sessionId: z.string().min(1),
    deckId: z.string().min(1),
    cardId: z.string().min(1),
    currentIndex: z.number().int().nonnegative(),
    cardCount: z.number().int().positive(),
    answeredAt: z.number().nonnegative(),
    rating: studyRatingSchema.optional(),
    fsrs: fsrsStateSchema.optional(),
    direction: z.enum(["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"]).optional(),
  })
  .strict()
  .refine((operation) => operation.currentIndex < operation.cardCount)
  .refine((operation) => (operation.rating === undefined) === (operation.fsrs === undefined));

export type StudyOperation = z.infer<typeof studyOperationSchema>;
