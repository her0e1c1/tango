import { z } from "zod";

import type { StudySession } from "./types";

export const studySessionSchema: z.ZodType<StudySession> = z
  .object({
    sessionId: z.string().min(1),
    deckId: z.string().min(1),
    cardOrderIds: z.array(z.string().min(1)).min(1),
    currentIndex: z.number().int().nonnegative(),
    lastStudiedAt: z.number().nonnegative(),
  })
  .refine((session) => session.currentIndex < session.cardOrderIds.length, {
    message: "Study session index must point to an active card",
    path: ["currentIndex"],
  });

export const persistedStudySessionStateSchema = z.object({
  sessionsByDeckId: z.record(z.string(), z.unknown()),
});
