import { doc, Timestamp, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import type { StudyRating } from "../model/rating";
import { studyAnswerDocumentSchema } from "./studyAnswerDocument";

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
  const reference = doc(db, "studyAnswer", input.id);
  batch.set(reference, answer);
  return reference;
}
