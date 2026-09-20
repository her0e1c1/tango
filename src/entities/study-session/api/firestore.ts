import { collection, doc, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } from "firebase/firestore";
import { db } from "@/shared/firebase";
import { replaceRemoteStudySessions } from "../model/actions/replaceRemoteStudySessions";
import { compareStudySessionCreation } from "../model/rules";
import { finishStudySessionLoading } from "../model/actions/finishStudySessionLoading";
import { setStudySessionOwner } from "../model/actions/setStudySessionOwner";
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
  await updateDoc(reference, {
    ...(endReason === "abandoned" ? {} : { currentIndex: value.currentIndex }),
    ...(endReason === null ? {} : { endReason, endedAt: serverTimestamp() }),
    updatedAt: serverTimestamp(),
  });
}

export function subscribeStudySessions(uid: string, onError: (error: Error) => void): () => void {
  setStudySessionOwner(uid);
  return onSnapshot(
    query(collection(db, "studySession"), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      // Pending timestamps are incomplete; keep locally saved progress until the SDK confirms the snapshot.
      if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites) return;
      const latest = new Map<string, StudySessionWrite>();
      for (const item of snapshot.docs) {
        const parsed = parseStudySessionDocument(item.data());
        if (parsed === undefined) continue;
        const write = toStudySessionWrite(item.id, parsed);
        const previous = latest.get(parsed.deckId);
        if (previous === undefined || compareStudySessionCreation(write.session, previous.session) > 0) {
          latest.set(parsed.deckId, write);
        }
      }
      replaceRemoteStudySessions(
        [...latest.values()].filter(({ endReason }) => endReason === null).map(({ session }) => session)
      );
    },
    (error) => {
      finishStudySessionLoading();
      onError(error);
    }
  );
}
