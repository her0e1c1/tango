import { doc, serverTimestamp, type Transaction } from "firebase/firestore";
import { db } from "@/shared/firebase";
import type { StudySession } from "../model/types";
import { parseStudySessionDocument, toStudySessionWrite } from "./document";

export async function readStudySession(transaction: Transaction, sessionId: string) {
  const snapshot = await transaction.get(doc(db, "studySession", sessionId));
  const document = parseStudySessionDocument(snapshot.data());
  if (document === undefined) throw new Error("Study session has not been saved");
  return toStudySessionWrite(sessionId, document);
}

export function writeStudySessionPosition(transaction: Transaction, session: StudySession, targetIndex: number): void {
  const completed = targetIndex === session.cardOrderIds.length;
  transaction.update(doc(db, "studySession", session.sessionId), {
    currentIndex: completed ? targetIndex - 1 : targetIndex,
    ...(completed ? { endReason: "completed", endedAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });
}
