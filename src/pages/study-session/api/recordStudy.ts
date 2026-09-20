import { runTransaction } from "firebase/firestore";
import { readOwnedDeck } from "@/entities/deck";
import { recordLocalStudy } from "@/entities/card";
import {
  assertSameStudyAttempt,
  readStudyAttempt,
  studyAttemptSchema,
  writeStudyAttempt,
  type StudyAttemptInput,
} from "@/entities/study-progress";
import { applyStudyRating, readStudyTarget, writeStudyProgress } from "@/entities/study-progress";
import { auth, db } from "@/shared/firebase";

export async function recordStudy(
  actorUid: string,
  input: StudyAttemptInput,
  localOnly: boolean
): Promise<"committed" | "already-committed"> {
  const attempt = studyAttemptSchema.parse({ ...input, uid: actorUid });
  if (localOnly) return recordLocalStudy(attempt);
  if (!navigator.onLine) throw new Error("Study reviews require a connection");
  if (auth.currentUser?.uid !== actorUid) throw new Error("Study actor has changed");
  const updatedAt = Date.now();
  return await runTransaction(db, async (transaction) => {
    if (auth.currentUser?.uid !== actorUid) throw new Error("Study actor has changed");
    const existing = await readStudyAttempt(transaction, attempt.operationId);
    // Retained results remain confirmable even after their original Card or Deck is deleted.
    if (existing) {
      assertSameStudyAttempt(existing, attempt);
      return "already-committed";
    }
    const current = await readStudyTarget(transaction, actorUid, attempt.deckId, attempt.cardId);
    await readOwnedDeck(transaction, actorUid, attempt.deckId);
    writeStudyProgress(
      transaction,
      applyStudyRating(current.progress, attempt.rating, attempt.answeredAt),
      attempt.operationId,
      Math.max(updatedAt, current.updatedAt)
    );
    writeStudyAttempt(transaction, attempt);
    return "committed";
  });
}
