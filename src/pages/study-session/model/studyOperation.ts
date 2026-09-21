import { z } from "zod";
import { studyProgressEditSchema, studyRatingSchema } from "@/entities/study-progress";

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
    progress: studyProgressEditSchema
      .pick({ cardId: true, difficulty: true, numberOfSeen: true, lastSeenAt: true })
      .required(),
    direction: z.enum(["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"]).optional(),
  })
  .strict()
  .refine(
    (operation) => operation.currentIndex < operation.cardCount && operation.progress.cardId === operation.cardId
  );

export type StudyOperation = z.infer<typeof studyOperationSchema>;
