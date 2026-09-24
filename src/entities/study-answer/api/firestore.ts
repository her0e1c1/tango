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
import type { StudyAnswerHistory, StudyAnswerInput, StudyAnswerRecord } from "../model/types";
import { createStudyAnswerDocument, parseStudyAnswerRecord } from "./document";
import { z } from "zod";

export function writeStudyAnswer(batch: WriteBatch, input: StudyAnswerInput) {
  const document = createStudyAnswerDocument(input);
  batch.set(doc(db, "studyAnswer", input.id), document);
}

const studyAnswerHistoryInputSchema = z
  .object({
    uid: z.string().min(1),
    from: z.number(),
    to: z.number(),
    deckId: z.string().min(1).nullable(),
    limit: z.number().int().min(1).max(1000),
  })
  .refine(({ from, to }) => from < to, "Invalid history interval");

export function subscribeStudyAnswerHistory(
  input: z.infer<typeof studyAnswerHistoryInputSchema>,
  onHistory: (history: StudyAnswerHistory) => void,
  onError: (error: Error) => void
): () => void {
  const { uid, from, to, deckId, limit: maximum } = studyAnswerHistoryInputSchema.parse(input);
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
      const records: StudyAnswerRecord[] = [];
      // Invalid documents still consume the requested limit.
      for (const document of snapshot.docs.slice(0, maximum)) {
        const record = parseStudyAnswerRecord(document.id, document.data());
        if (record === null) {
          invalidCount += 1;
        } else {
          records.push(record);
        }
      }
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
