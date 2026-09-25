import { serverTimestamp, Timestamp, type DocumentData, type QuerySnapshot } from "firebase/firestore";
import type { StudyAnswerInput, StudyAnswerRecord, StudyAnswerSnapshot } from "../model/types";
import { z } from "zod";
import { studyRatingSchema } from "../model/schema";
import {
  compareSyncTimestamps,
  firestoreMetadataSchema,
  firestoreTimestampSchema,
  type SyncCheckpoint,
  type SyncTimestamp,
} from "@/shared/api";

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

function parseStudyAnswerSnapshot(id: string, data: DocumentData): StudyAnswerSnapshot {
  const answeredAt = firestoreTimestampSchema.parse(data.answeredAt);
  return { id, answeredAt, record: parseStudyAnswerRecord(id, data) };
}

export function retainStudyAnswerReplica(
  replica: AnswerReplica,
  maximum: number,
  lastUpdatedAt = replica.checkpoint.lastUpdatedAt
): AnswerReplica {
  const documents = Object.fromEntries(
    Object.entries(replica.checkpoint.documents)
      .sort(
        ([leftId, left], [rightId, right]) =>
          compareSyncTimestamps(
            firestoreTimestampSchema.parse(right.answeredAt),
            firestoreTimestampSchema.parse(left.answeredAt)
          ) || (leftId < rightId ? 1 : leftId > rightId ? -1 : 0)
      )
      .slice(0, maximum + 1)
  );
  return {
    checkpoint: { documents, lastUpdatedAt },
    values: new Map([...replica.values].filter(([id]) => Object.hasOwn(documents, id))),
  };
}

export interface AnswerReplica {
  checkpoint: SyncCheckpoint;
  values: Map<string, StudyAnswerSnapshot>;
}

export function parseAnswerReplica(checkpoint: SyncCheckpoint): AnswerReplica {
  const values = new Map<string, StudyAnswerSnapshot>();
  for (const [id, data] of Object.entries(checkpoint.documents)) {
    readAnswerUpdatedAt(data);
    values.set(id, parseStudyAnswerSnapshot(id, data));
  }
  return { checkpoint, values };
}

export type AnswerChange =
  | { success: true; data: DocumentData; value: StudyAnswerSnapshot; pending: boolean }
  | { success: false; error: unknown };

export function readAnswerUpdatedAt(data: DocumentData): SyncTimestamp {
  const value = firestoreTimestampSchema.parse(data.updatedAt);
  return { seconds: value.seconds, nanoseconds: value.nanoseconds };
}

export function readAnswerChanges(snapshot: QuerySnapshot, changes: Map<string, AnswerChange>) {
  for (const change of snapshot.docChanges({ includeMetadataChanges: true })) {
    const id = change.doc.id;
    if (change.type === "removed") {
      changes.delete(id);
      continue;
    }
    try {
      const data = change.doc.data({ serverTimestamps: "estimate" });
      readAnswerUpdatedAt(data);
      changes.set(id, {
        success: true,
        data,
        value: parseStudyAnswerSnapshot(id, data),
        pending: change.doc.metadata.hasPendingWrites,
      });
    } catch (error) {
      changes.set(id, { success: false, error });
    }
  }
}

export function mergeAnswerChanges(base: AnswerReplica | null, changes: Map<string, AnswerChange>) {
  const values = new Map(base?.values);
  const documents = new Map(Object.entries(base?.checkpoint.documents ?? {}));
  let lastUpdatedAt = base?.checkpoint.lastUpdatedAt ?? null;
  for (const [id, change] of changes) {
    if (!change.success) throw change.error;
    const previous = documents.get(id);
    const updatedAt = readAnswerUpdatedAt(change.data);
    if (!change.pending && previous && compareSyncTimestamps(updatedAt, readAnswerUpdatedAt(previous)) < 0) continue;
    values.set(id, change.value);
    documents.set(id, change.data);
    if (!change.pending && (lastUpdatedAt === null || compareSyncTimestamps(updatedAt, lastUpdatedAt) > 0))
      lastUpdatedAt = updatedAt;
  }
  return { checkpoint: { documents: Object.fromEntries(documents), lastUpdatedAt }, values };
}
