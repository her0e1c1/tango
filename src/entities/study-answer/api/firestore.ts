import {
  doc,
  Timestamp,
  type WriteBatch,
  collection,
  documentId,
  onSnapshot,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/shared/firebase";
import type { StudyRating } from "../model/rating";
import { studyAnswerDocumentSchema } from "./document";
import { z } from "zod";

interface StudyAnswerInput {
  id: string;
  uid: string;
  sessionId: string;
  deckId: string;
  cardId: string;
  rating: StudyRating;
  answeredAt: number;
}

export function writeStudyAnswer(batch: WriteBatch, input: StudyAnswerInput) {
  const answeredAt = Timestamp.fromMillis(input.answeredAt);
  const answer = studyAnswerDocumentSchema.parse({
    uid: input.uid,
    sessionId: input.sessionId,
    deckId: input.deckId,
    cardId: input.cardId,
    answer: { type: "rating", rating: input.rating },
    answeredAt,
    createdAt: answeredAt,
    updatedAt: answeredAt,
  });
  batch.set(doc(db, "studyAnswer", input.id), answer);
}

const inputSchema = z
  .object({
    uid: z.string().min(1),
    from: z.number(),
    to: z.number(),
    deckId: z.string().min(1).nullable(),
    limit: z.number().int().min(1).max(1000),
  })
  .refine(({ from, to }) => from < to, "Invalid history interval");

export interface StudyAnswerRecord {
  id: string;
  deckId: string;
  sessionId: string;
  answeredAt: number;
  rating: StudyRating;
}

export interface StudyAnswerHistory {
  records: StudyAnswerRecord[];
  source: "cache" | "server";
  truncated: boolean;
  invalidCount: number;
  hasPendingWrites: boolean;
}

export function subscribeStudyAnswerHistory(
  input: z.infer<typeof inputSchema>,
  onHistory: (history: StudyAnswerHistory) => void,
  onError: (error: Error) => void
): () => void {
  const { uid, from, to, deckId, limit: maximum } = inputSchema.parse(input);
  const user = auth.currentUser;
  if (!user || user.uid !== uid) throw new Error("History owner is not the current user");
  const request = query(
    collection(db, "studyAnswer"),
    where("uid", "==", uid),
    ...(deckId === null ? [] : [where("deckId", "==", deckId)]),
    where("answeredAt", ">=", Timestamp.fromMillis(from)),
    where("answeredAt", "<", Timestamp.fromMillis(to)),
    orderBy("answeredAt", "desc"),
    orderBy(documentId(), "desc"),
    limit(maximum + 1)
  );
  return onSnapshot(
    request,
    { includeMetadataChanges: true, source: user.isAnonymous ? "cache" : "default" },
    (snapshot) => {
      if (auth.currentUser !== user) return;
      let invalidCount = 0;
      const records = snapshot.docs.slice(0, maximum).flatMap((document) => {
        const parsed = studyAnswerDocumentSchema.safeParse(document.data());
        if (!parsed.success) {
          invalidCount += 1;
          return [];
        }
        const value = parsed.data;
        return [
          {
            id: document.id,
            deckId: value.deckId,
            sessionId: value.sessionId,
            answeredAt: value.answeredAt.seconds * 1000 + value.answeredAt.nanoseconds / 1_000_000,
            rating: value.answer.rating,
          },
        ];
      });
      onHistory({
        records,
        source: snapshot.metadata.fromCache ? "cache" : "server",
        truncated: snapshot.size > maximum,
        invalidCount,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      });
    },
    (error) => {
      if (auth.currentUser === user) onError(error);
    }
  );
}
