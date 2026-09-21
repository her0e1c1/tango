import { doc, Timestamp, type WriteBatch } from "firebase/firestore";
import { db } from "@/shared/firebase";
import type { StudySession } from "../model/types";

export function writeStudySessionPosition(batch: WriteBatch, session: StudySession, targetIndex: number) {
  const completed = targetIndex === session.cardOrderIds.length;
  const currentIndex = completed ? targetIndex - 1 : targetIndex;
  const endReason = completed ? "completed" : null;
  const reference = doc(db, "studySession", session.sessionId);
  batch.update(reference, {
    currentIndex,
    ...(completed ? { endReason, endedAt: Timestamp.fromMillis(session.lastStudiedAt) } : {}),
    updatedAt: Timestamp.fromMillis(session.lastStudiedAt),
  });
  return { reference, session: { ...session, currentIndex }, endReason };
}
