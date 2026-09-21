import { doc, Timestamp, writeBatch } from "firebase/firestore";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { writeLocally } from "@/shared/firestore-write";
import { getAuthUid } from "@/entities/auth";
import { writeStudyProgress } from "@/entities/study-progress";
import { getStudySession, writeStudySessionPosition, type StudySession } from "@/entities/study-session";
import { db } from "@/shared/firebase";
import { studyOperationSchema, type StudyOperation } from "../model/studyOperation";
import type { AnswerType, StudyAnswerDocument } from "./studyAnswerDocument";

export async function saveStudyOperation(input: StudyOperation, session: StudySession) {
  const operation = studyOperationSchema.parse(input);
  if (operation.uid === "" || getAuthUid() !== operation.uid) throw new Error("Study user changed");
  const current = getStudySession(operation.deckId);
  if (
    current?.sessionId !== session.sessionId ||
    current.currentIndex !== operation.currentIndex ||
    session.remote.uid !== operation.uid ||
    session.currentIndex !== operation.currentIndex ||
    session.sessionId !== operation.sessionId ||
    session.deckId !== operation.deckId ||
    session.cardOrderIds[operation.currentIndex] !== operation.cardId ||
    session.cardOrderIds.length !== operation.cardCount
  )
    throw new Error("Study session does not match");
  const card = getCards().find(({ id }) => id === operation.cardId);
  const deck = getDecks().find(({ id }) => id === operation.deckId);
  if (card?.uid !== operation.uid || deck?.uid !== operation.uid || card.deckId !== deck.id)
    throw new Error("Study references do not match");
  const reference = doc(db, "studyAnswer", operation.id);
  const batch = writeBatch(db);
  if (operation.rating !== undefined) {
    const type: AnswerType = "rating";
    const answer: Omit<StudyAnswerDocument, "createdAt" | "updatedAt"> = {
      uid: operation.uid,
      sessionId: operation.sessionId,
      deckId: operation.deckId,
      cardId: operation.cardId,
      answer: { type, rating: operation.rating },
      answeredAt: Timestamp.fromMillis(operation.answeredAt),
    };
    batch.set(reference, { ...answer, createdAt: answer.answeredAt, updatedAt: answer.answeredAt });
  }
  writeStudyProgress(
    batch,
    { ...operation.progress, cardId: operation.cardId, lastSeenAt: operation.answeredAt },
    operation.answeredAt
  );
  const result = writeStudySessionPosition(
    batch,
    { ...session, lastStudiedAt: operation.answeredAt },
    operation.currentIndex + 1
  );
  const references = [doc(db, "card", operation.cardId), doc(db, "studySession", operation.sessionId)];
  if (operation.rating !== undefined) references.push(reference);
  await writeLocally(operation.uid, references, () => batch.commit());
  return result;
}
