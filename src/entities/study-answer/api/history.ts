import {
  collection,
  documentId,
  getDocs,
  getDocsFromCache,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { z } from "zod";
import { auth, db } from "@/shared/firebase";
import type { StudyRating } from "../model/rating";
import { studyAnswerDocumentSchema } from "./studyAnswerDocument";

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

export async function readStudyAnswerHistory(input: z.infer<typeof inputSchema>): Promise<StudyAnswerHistory> {
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
  const snapshot = await (user.isAnonymous ? getDocsFromCache(request) : getDocs(request));
  if (auth.currentUser !== user) throw new Error("History owner changed during read");
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
  return {
    records,
    source: snapshot.metadata.fromCache ? "cache" : "server",
    truncated: snapshot.size > maximum,
    invalidCount,
    hasPendingWrites: snapshot.metadata.hasPendingWrites,
  };
}
