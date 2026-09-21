import { writeStudySchedule } from "@/entities/study-schedule";
import { writeStudyAnswer } from "@/entities/study-answer";
import { getCards } from "@/entities/card";
import { getDecks } from "@/entities/deck";
import { createLocalBatch } from "@/shared/firestore-write";
import { getAuthUid } from "@/entities/auth";
import { writeStudyProgress } from "@/entities/study-progress";
import { getStudySession, writeStudySessionPosition, type StudySession } from "@/entities/study-session";
import { studyOperationSchema, type StudyOperation } from "../studyOperation";

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
  const { batch, commit } = createLocalBatch(operation.uid);
  const progressReference = writeStudyProgress(
    batch,
    { ...operation.progress, cardId: operation.cardId, lastSeenAt: operation.answeredAt },
    operation.answeredAt
  );
  const result = writeStudySessionPosition(
    batch,
    { ...session, lastStudiedAt: operation.answeredAt },
    operation.currentIndex + 1
  );
  const references = [progressReference, result.reference];
  if (operation.rating !== undefined && operation.schedule !== undefined) {
    writeStudySchedule(batch, operation.cardId, operation.schedule, operation.answeredAt);
    references.push(writeStudyAnswer(batch, { ...operation, rating: operation.rating }));
  }
  await commit(references);
  return result;
}
