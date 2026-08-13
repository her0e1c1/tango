import type { StudyProgress, StudyProgressEdit } from "../model/studyProgress";

import { z } from "zod";

import { parseCardDocument } from "@/entities/card/@x/study-progress";
import { firestoreTimestampDateSchema } from "@/shared/firestore";

const studyProgressUpdateDtoSchema = z.object({
  score: z.number().optional(),
  numberOfSeen: z.number().optional(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: firestoreTimestampDateSchema.optional(),
  interval: z.number().optional(),
  updatedAt: z.number(),
});

export type StudyProgressUpdateDto = z.infer<typeof studyProgressUpdateDtoSchema>;

const omitUndefined = (value: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));

export const mapStudyProgressDocument = (cardId: string, value: unknown): StudyProgress => {
  const document = parseCardDocument(cardId, value);
  const progress: StudyProgress = {
    cardId,
    score: document.score,
    numberOfSeen: document.numberOfSeen,
  };
  if (document.lastSeenAt !== undefined) progress.lastSeenAt = document.lastSeenAt;
  if (document.nextSeeingAt !== undefined) progress.nextSeeingAt = document.nextSeeingAt;
  if (document.interval !== undefined) progress.interval = document.interval;
  return progress;
};

export const buildStudyProgressUpdateDto = (progress: StudyProgressEdit, updatedAt: number): StudyProgressUpdateDto =>
  studyProgressUpdateDtoSchema.parse(
    omitUndefined({
      ...progress,
      cardId: undefined,
      updatedAt,
    })
  );
