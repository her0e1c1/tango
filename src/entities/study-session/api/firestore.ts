import {
  collection,
  doc,
  getDocFromServer,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/shared/firebase";
import { studySessionSchema } from "../model/schema";
import type { StudySession, StudySessionWrite } from "../model/types";
import { parseStudySessionDocument, toStudySessionDocument, toStudySessionWrite } from "./document";

export async function createStudySession(session: StudySession): Promise<void> {
  const value = studySessionSchema.parse(session);
  await setDoc(doc(db, "studySession", value.sessionId), {
    ...toStudySessionDocument(value),
    endedAt: null,
    endReason: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateStudySession(
  session: StudySession,
  endReason: StudySessionWrite["endReason"]
): Promise<void> {
  const value = studySessionSchema.parse(session);
  if (value.remote === undefined) throw new Error("A local study session cannot be written to Firestore");
  const reference = doc(db, "studySession", value.sessionId);
  // Progress never writes active lifecycle fields; a delayed update cannot reopen an ended run.
  try {
    await updateDoc(reference, {
      ...(endReason === "abandoned" ? {} : { currentIndex: value.currentIndex }),
      ...(endReason === null ? {} : { endReason, endedAt: serverTimestamp() }),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    if (endReason === "abandoned" && error instanceof Error && "code" in error && error.code === "permission-denied") {
      // Restart still succeeds when another device has already finished the old run.
      const current = parseStudySessionDocument((await getDocFromServer(reference)).data());
      if (current?.uid === value.remote.uid && current.endReason !== null) return;
    }
    throw error;
  }
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
      // Wait for complete server data before allowing a start that could replace an unknown run.
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      const sessions: StudySessionWrite[] = [];
      for (const item of snapshot.docs) {
        const parsed = parseStudySessionDocument(item.data());
        if (parsed !== undefined) sessions.push(toStudySessionWrite(item.id, parsed));
      }
      onChange(sessions);
    },
    onError
  );
}
