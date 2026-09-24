import { writeCardFsrs, getCards } from "@/entities/card";
import { writeStudyAnswer } from "@/entities/study-answer";
import { getDecks } from "@/entities/deck";
import { writeBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { getAuthUid } from "@/entities/auth";
import { getStudySession, writeStudySessionPosition, type StudySession } from "@/entities/study-session";
import { studyOperationSchema, type StudyOperation } from "../studyOperation";

export function saveStudyOperation(input: StudyOperation, session: StudySession) {
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
  const batch = writeBatch(db);
  const result = writeStudySessionPosition(
    batch,
    { ...session, lastStudiedAt: operation.answeredAt },
    operation.currentIndex + 1
  );
  if (operation.rating !== undefined && operation.fsrs !== undefined) {
    writeCardFsrs(batch, { ...operation, fsrs: operation.fsrs });
    writeStudyAnswer(batch, { ...operation, rating: operation.rating });
  }
  void batch.commit().catch(() => undefined);
  return result;
}
