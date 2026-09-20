import { Timestamp } from "firebase/firestore";
import { z } from "zod";
import { firestoreMetadataSchema, firestoreTimestampSchema } from "@/shared/api";
import type { StudySession, StudySessionWrite } from "../model/types";

const studySessionDocumentSchema = firestoreMetadataSchema
  .extend({
    uid: z.string().min(1),
    deckId: z.string().min(1),
    cardOrderIds: z.array(z.string().min(1)).min(1),
    currentIndex: z.number().int().nonnegative(),
    startedAt: firestoreTimestampSchema,
    endedAt: firestoreTimestampSchema.nullable(),
    endReason: z.enum(["completed", "abandoned"]).nullable(),
  })
  .strict()
  .refine(
    (value) => value.currentIndex < value.cardOrderIds.length && (value.endedAt === null) === (value.endReason === null)
  );

type StudySessionDocument = z.infer<typeof studySessionDocumentSchema>;

export function parseStudySessionDocument(value: unknown): StudySessionDocument | undefined {
  const parsed = studySessionDocumentSchema.safeParse(value);
  return parsed.success ? parsed.data : undefined;
}

export function toStudySessionWrite(sessionId: string, document: StudySessionDocument): StudySessionWrite {
  return {
    session: {
      sessionId,
      deckId: document.deckId,
      cardOrderIds: document.cardOrderIds,
      currentIndex: document.currentIndex,
      // Client timestamps are available in local snapshots before cloud acknowledgement.
      lastStudiedAt: document.updatedAt.toDate().getTime(),
      remote: {
        uid: document.uid,
        startedAt: document.startedAt.toDate().getTime(),
        // Keep sub-millisecond precision when ordering runs by their authoritative creation time.
        createdAt: document.createdAt.seconds * 1000 + document.createdAt.nanoseconds / 1_000_000,
      },
    },
    endReason: document.endReason,
  };
}

export function toStudySessionDocument(session: StudySession) {
  if (session.remote === undefined) throw new Error("A local study session cannot be written to Firestore");
  return {
    uid: session.remote.uid,
    deckId: session.deckId,
    cardOrderIds: session.cardOrderIds,
    currentIndex: session.currentIndex,
    startedAt: Timestamp.fromMillis(session.remote.startedAt),
  };
}
