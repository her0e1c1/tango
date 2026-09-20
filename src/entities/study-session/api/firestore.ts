import { collection, doc, getDoc, onSnapshot, query, runTransaction, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { studySessionWriteSchema } from "../model/schema";
import type { StudySessionWrite } from "../model/types";
import { parseStudySessionDocument, toStudySessionDocument, toStudySessionWrite } from "./document";
import { finishSupersededStudySessions } from "./finishSupersededStudySessions";

export async function saveStudySession(uid: string, write: StudySessionWrite): Promise<StudySessionWrite> {
  const { session, endReason } = studySessionWriteSchema.parse(write);
  if (!uid || session.remote?.uid !== uid) throw new Error("Study session owner does not match the current user");
  const reference = doc(db, "studySession", session.sessionId);
  const saved = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists()) {
      transaction.set(reference, {
        ...toStudySessionDocument(session),
        endedAt: endReason === null ? null : serverTimestamp(),
        endReason,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return undefined;
    }
    const current = parseStudySessionDocument(snapshot.id, snapshot.data());
    if (
      current.uid !== uid ||
      current.deckId !== session.deckId ||
      JSON.stringify(current.cardOrderIds) !== JSON.stringify(session.cardOrderIds)
    ) {
      throw new Error("Study session identity cannot change");
    }
    // Transactions and monotonic positions make retries and other tabs safe, including delayed active writes.
    if (current.endReason !== null) return toStudySessionWrite(snapshot.id, current);
    const currentIndex = Math.max(current.currentIndex, session.currentIndex);
    if (currentIndex === current.currentIndex && endReason === null) return toStudySessionWrite(snapshot.id, current);
    transaction.update(reference, {
      currentIndex,
      endReason,
      endedAt: endReason === null ? null : serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return toStudySessionWrite(snapshot.id, { ...current, currentIndex, endReason });
  });
  if (saved !== undefined && session.remote.createdAt !== undefined) return saved;
  // Retry this step with the original id if creation committed but reconciliation or acknowledgement failed.
  await finishSupersededStudySessions(uid, session.deckId, session.sessionId);
  // A new run needs the resolved server creation time before it participates in cross-device ordering.
  const created = await getDoc(reference);
  return toStudySessionWrite(created.id, parseStudySessionDocument(created.id, created.data()));
}

export function subscribeStudySessions(
  uid: string,
  onChange: (sessions: StudySessionWrite[]) => void,
  onError: (error: Error) => void
): () => void {
  return onSnapshot(
    query(collection(db, "studySession"), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      // An incomplete cache must not delete a session whose server document has not arrived yet.
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      try {
        onChange(
          snapshot.docs.map((item) => toStudySessionWrite(item.id, parseStudySessionDocument(item.id, item.data())))
        );
      } catch (error) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    onError
  );
}
