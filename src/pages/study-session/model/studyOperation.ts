import { studyScheduleSchema } from "@/entities/study-schedule";
import { z } from "zod";
import { studyRatingSchema } from "@/entities/study-answer";
import { studyProgressEditSchema } from "@/entities/study-progress";

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
    schedule: studyScheduleSchema.optional(),
    progress: studyProgressEditSchema
      .pick({ difficulty: true, numberOfSeen: true })
      .required({ difficulty: true, numberOfSeen: true }),
    direction: z.enum(["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"]).optional(),
  })
  .strict()
  .refine((operation) => operation.currentIndex < operation.cardCount)
  .refine((operation) => (operation.rating === undefined) === (operation.schedule === undefined));

export type StudyOperation = z.infer<typeof studyOperationSchema>;
