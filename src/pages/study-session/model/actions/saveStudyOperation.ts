import { editCard, getCards } from "@/entities/card";
import { writeStudyAnswer } from "@/entities/study-answer";
import { getDecks } from "@/entities/deck";
import { getAuthUid } from "@/entities/auth";
import { getStudySession, writeStudySessionPosition, type StudySession } from "@/entities/study-session";
import { studyOperationSchema, type StudyOperation } from "../studyOperation";

function assertMatchingStudySession(operation: StudyOperation, session: StudySession): void {
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
}

export async function saveStudyOperation(input: StudyOperation, session: StudySession) {
  const operation = studyOperationSchema.parse(input);
  if (operation.uid === "" || getAuthUid() !== operation.uid) throw new Error("Study user changed");
  assertMatchingStudySession(operation, session);
  const card = getCards().find(({ id }) => id === operation.cardId);
  const deck = getDecks().find(({ id }) => id === operation.deckId);
  if (card?.uid !== operation.uid || deck?.uid !== operation.uid || card.deckId !== deck.id || card.deletedAt !== null)
    throw new Error("Study references do not match");
  // Queue every write before awaiting server acknowledgements so offline saves remain local-first.
  const writes: Promise<void>[] = [];
  if (operation.rating !== undefined && operation.fsrs !== undefined) {
    writes.push(
      editCard(operation.uid, { id: operation.cardId, fsrs: operation.fsrs }),
      writeStudyAnswer({ ...operation, rating: operation.rating })
    );
  }
  const position = writeStudySessionPosition(
    { ...session, lastStudiedAt: operation.answeredAt },
    operation.currentIndex + 1
  );
  const results = await Promise.allSettled([...writes, position]);
  const failure = results.find((result) => result.status === "rejected");
  if (failure?.status === "rejected") throw failure.reason;
  return position;
}
