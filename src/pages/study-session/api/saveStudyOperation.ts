import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { getAuthUid } from "@/entities/auth";
import { readStudyProgress, recordCardStudyProgress, writeStudyProgress } from "@/entities/study-progress";
import { readStudySession, writeStudySessionPosition } from "@/entities/study-session";
import { db } from "@/shared/firebase";
import { studyOperationSchema, type StudyOperation } from "../model/studyOperation";
import { studyAnswerDocumentSchema, type AnswerType, type StudyAnswerDocument } from "./studyAnswerDocument";

export async function saveStudyOperation(input: StudyOperation) {
  const operation = studyOperationSchema.parse(input);
  if (operation.uid === "" || getAuthUid() !== operation.uid) throw new Error("Study user changed");
  if (globalThis.navigator?.onLine === false) throw new Error("Study answers require a connection");
  const reference = doc(db, "studyAnswer", operation.id);
  return await runTransaction(db, async (transaction) => {
    // Firebase may rerun this callback. Identity, time and payload were fixed before entering it.
    if (getAuthUid() !== operation.uid) throw new Error("Study user changed");
    const existing = operation.rating === undefined ? undefined : await transaction.get(reference);
    const write = await readStudySession(transaction, operation.sessionId);
    const { session, endReason } = write;
    if (session.remote?.uid !== operation.uid || session.deckId !== operation.deckId) {
      throw new Error("Study session owner or deck does not match");
    }
    if (existing?.exists()) {
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
      return {
        status: "already-saved" as const,
        ...write,
        session: { ...session, lastStudiedAt: operation.answeredAt },
      };
    }
    if (
      endReason !== null ||
      session.currentIndex !== operation.currentIndex ||
      session.cardOrderIds[operation.currentIndex] !== operation.cardId ||
      session.cardOrderIds.length !== operation.cardCount
    )
      return { status: "stale" as const, ...write };

    const card = operation.recordProgress ? await readStudyProgress(transaction, operation.cardId) : undefined;
    if (
      card !== undefined &&
      (card.uid !== operation.uid || card.deckId !== operation.deckId || card.deletedAt !== null)
    ) {
      throw new Error("Study card owner or deck does not match");
    }
    if (operation.rating !== undefined) {
      const type: AnswerType = "rating";
      // Server transforms are write values, not resolved document timestamps.
      const answer: Omit<StudyAnswerDocument, "createdAt" | "updatedAt"> = {
        uid: operation.uid,
        sessionId: operation.sessionId,
        deckId: operation.deckId,
        cardId: operation.cardId,
        answer: { type, rating: operation.rating },
        answeredAt: Timestamp.fromMillis(operation.answeredAt),
      };
      transaction.set(reference, { ...answer, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    }
    if (card !== undefined) {
      writeStudyProgress(
        transaction,
        recordCardStudyProgress(card, operation.rating, operation.answeredAt),
        operation.answeredAt
      );
    }
    writeStudySessionPosition(transaction, session, operation.targetIndex);
    const completed = operation.targetIndex === operation.cardCount;
    return {
      status: "saved" as const,
      session: {
        ...session,
        currentIndex: completed ? operation.targetIndex - 1 : operation.targetIndex,
        lastStudiedAt: operation.answeredAt,
      },
      endReason: completed ? ("completed" as const) : null,
    };
  });
}
