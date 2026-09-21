import { doc, getDocFromServer, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import { getAuthUid } from "@/entities/auth";
import { writeStudyProgress } from "@/entities/study-progress";
import { writeStudySessionPosition, type StudySession } from "@/entities/study-session";
import { db } from "@/shared/firebase";
import { studyOperationSchema, type StudyOperation } from "../model/studyOperation";
import { studyAnswerDocumentSchema, type AnswerType, type StudyAnswerDocument } from "./studyAnswerDocument";

export async function saveStudyOperation(input: StudyOperation, session: StudySession) {
  const operation = studyOperationSchema.parse(input);
  if (operation.uid === "" || getAuthUid() !== operation.uid) throw new Error("Study user changed");
  if (
    session.remote?.uid !== operation.uid ||
    session.sessionId !== operation.sessionId ||
    session.deckId !== operation.deckId ||
    session.cardOrderIds[operation.currentIndex] !== operation.cardId ||
    session.cardOrderIds.length !== operation.cardCount
  )
    throw new Error("Study session does not match");
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
    batch.set(reference, { ...answer, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
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
  try {
    await batch.commit();
  } catch (error) {
    // Only a server-confirmed matching result can acknowledge an uncertain write. Never issue a new ID.
    if (getAuthUid() !== operation.uid) throw error;
    if (operation.rating !== undefined) {
      const existing = await getDocFromServer(reference);
      if (!existing.exists()) throw error;
      const answer = studyAnswerDocumentSchema.parse(existing.data());
      if (
        answer.uid !== operation.uid ||
        answer.sessionId !== operation.sessionId ||
        answer.deckId !== operation.deckId ||
        answer.cardId !== operation.cardId ||
        answer.answer.rating !== operation.rating ||
        answer.answeredAt.toDate().getTime() !== operation.answeredAt
      )
        throw new Error("An answer with different contents already exists");
    } else {
      // Skip has no answer document. Its fixed absolute progress and position are safe to acknowledge together.
      const [savedSession, savedCard] = await Promise.all([
        getDocFromServer(doc(db, "studySession", operation.sessionId)),
        getDocFromServer(doc(db, "card", operation.cardId)),
      ]);
      const card = savedCard.data();
      if (
        savedSession.data()?.currentIndex !== result.session.currentIndex ||
        savedSession.data()?.endReason !== result.endReason ||
        card?.numberOfSeen !== operation.progress.numberOfSeen ||
        card.difficulty !== operation.progress.difficulty ||
        card.lastSeenAt !== operation.answeredAt
      )
        throw error;
    }
  }
  return result;
}
