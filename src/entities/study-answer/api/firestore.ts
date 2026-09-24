import {
  doc,
  Timestamp,
  type WriteBatch,
  collection,
  documentId,
  startAt,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/shared/firebase";
import type { StudyAnswerHistory, StudyAnswerInput } from "../model/types";
import { createStudyAnswerDocument, parseStudyAnswerSnapshot, retainStudyAnswerDocuments } from "./document";
import { subscribeSyncedQuery } from "@/shared/api";
import { studyAnswerStore } from "../model/store";
import { applyStudyAnswerSnapshot } from "../model/actions/applyStudyAnswerSnapshot";
import { getStudyAnswerHistory } from "../model/queries/getStudyAnswerHistory";
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
  const scope = JSON.stringify([db.app.options.projectId, uid, from, to, deckId, maximum]);
  const constraints = [
    where("uid", "==", uid),
    ...(deckId === null ? [] : [where("deckId", "==", deckId)]),
    where("answeredAt", ">=", Timestamp.fromMillis(from)),
    where("answeredAt", "<", Timestamp.fromMillis(to)),
  ];
  const reference = collection(db, "studyAnswer");
  return subscribeSyncedQuery({
    scope,
    store: studyAnswerStore,
    source: user.isAnonymous ? "cache" : "default",
    // A cursor includes unresolved server timestamps; a timestamp inequality does not.
    // The non-null inequality permits updatedAt ordering alongside the event-time range.
    request: (cursor) =>
      query(
        reference,
        ...constraints,
        where("updatedAt", "!=", null),
        orderBy("updatedAt"),
        orderBy("answeredAt"),
        orderBy(documentId()),
        ...(cursor ? [startAt(new Timestamp(cursor.seconds, cursor.nanoseconds))] : [])
      ),
    bootstrap: {
      boundary: query(
        reference,
        ...constraints,
        where("updatedAt", "!=", null),
        orderBy("updatedAt", "desc"),
        orderBy("answeredAt", "desc"),
        orderBy(documentId(), "desc"),
        limit(1)
      ),
      initial: query(
        reference,
        ...constraints,
        orderBy("answeredAt", "desc"),
        orderBy(documentId(), "desc"),
        limit(maximum + 1)
      ),
    },
    parse: parseStudyAnswerSnapshot,
    retain: (documents) => retainStudyAnswerDocuments(documents, maximum),
    receive: (result) => {
      if (auth.currentUser !== user) return;
      const saved = applyStudyAnswerSnapshot(scope, result.checkpoint);
      onHistory(getStudyAnswerHistory(result, maximum));
      return saved;
    },
    onError: (error) => {
      if (auth.currentUser === user) onError(error);
    },
  });
}
