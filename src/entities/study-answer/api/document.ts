import { serverTimestamp, Timestamp, type DocumentData } from "firebase/firestore";
import type { StudyAnswerInput, StudyAnswerRecord, StudyAnswerSnapshot } from "../model/types";
import { z } from "zod";
import { studyRatingSchema } from "../model/schema";
import { compareSyncTimestamps, firestoreMetadataSchema, firestoreTimestampSchema } from "@/shared/api";

const ratingAnswerSchema = z
  .object({
    type: z.literal("rating"),
    rating: studyRatingSchema,
  })
  .strict();

const studyAnswerDocumentSchema = firestoreMetadataSchema
  .extend({
    uid: z.string().min(1),
    sessionId: z.string().min(1),
    deckId: z.string().min(1),
    cardId: z.string().min(1),
    answer: ratingAnswerSchema,
    answeredAt: firestoreTimestampSchema,
  })
  .strict();

export function createStudyAnswerDocument(input: StudyAnswerInput) {
  const answeredAt = Timestamp.fromMillis(input.answeredAt);
  const document = studyAnswerDocumentSchema.parse({
    uid: input.uid,
    sessionId: input.sessionId,
    deckId: input.deckId,
    cardId: input.cardId,
    answer: { type: "rating", rating: input.rating },
    answeredAt,
    createdAt: answeredAt,
    updatedAt: answeredAt,
  });
  return { ...document, updatedAt: serverTimestamp() };
}

function parseStudyAnswerRecord(id: string, data: unknown): StudyAnswerRecord | null {
  const parsed = studyAnswerDocumentSchema.safeParse(data);
  if (!parsed.success) return null;
  const value = parsed.data;
  return {
    id,
    deckId: value.deckId,
    sessionId: value.sessionId,
    answeredAt: value.answeredAt.seconds * 1000 + value.answeredAt.nanoseconds / 1_000_000,
    rating: value.answer.rating,
  };
}

export function parseStudyAnswerSnapshot(id: string, data: DocumentData): StudyAnswerSnapshot {
  const answeredAt = firestoreTimestampSchema.parse(data.answeredAt);
  return { id, answeredAt, record: parseStudyAnswerRecord(id, data) };
}

export function retainStudyAnswerDocuments(documents: Record<string, DocumentData>, maximum: number) {
  return Object.fromEntries(
    Object.entries(documents)
      .sort(
        ([leftId, left], [rightId, right]) =>
          compareSyncTimestamps(
            firestoreTimestampSchema.parse(right.answeredAt),
            firestoreTimestampSchema.parse(left.answeredAt)
          ) || (leftId < rightId ? 1 : leftId > rightId ? -1 : 0)
      )
      .slice(0, maximum + 1)
  );
}
