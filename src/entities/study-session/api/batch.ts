import { doc, serverTimestamp, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import type { StudySession, StudySessionWrite } from "../model/types";

export function writeStudySessionPosition(
  batch: WriteBatch,
  session: StudySession,
  targetIndex: number
): StudySessionWrite {
  const completed = targetIndex === session.cardOrderIds.length;
  const currentIndex = completed ? targetIndex - 1 : targetIndex;
  const endReason = completed ? "completed" : null;
  batch.update(doc(db, "studySession", session.sessionId), {
    currentIndex,
    ...(completed ? { endReason, endedAt: serverTimestamp() } : {}),
    updatedAt: serverTimestamp(),
  });
  return { session: { ...session, currentIndex }, endReason };
}
