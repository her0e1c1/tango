import { collection, doc, onSnapshot, query, Timestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { writeLocally } from "@/shared/firestore-write";
import { db } from "@/shared/firebase";
import { replaceRemoteStudySessions } from "../model/actions/replaceRemoteStudySessions";
import { compareStudySessionCreation } from "../model/rules";
import { finishStudySessionLoading } from "../model/actions/finishStudySessionLoading";
import { setStudySessionOwner } from "../model/actions/setStudySessionOwner";
import { studySessionSchema } from "../model/schema";
import type { StudySession, StudySessionWrite } from "../model/types";
import { parseStudySessionDocument, toStudySessionDocument, toStudySessionWrite } from "./document";

export async function createStudySession(session: StudySession, previous?: StudySession): Promise<void> {
  const value = studySessionSchema.parse(session);
  if (value.remote === undefined) throw new Error("A confirmed owner is required");
  const reference = doc(db, "studySession", value.sessionId);
  const now = Timestamp.now();
  const batch = writeBatch(db);
  const references = [reference];
  batch.set(reference, {
    ...toStudySessionDocument(value),
    endedAt: null,
    endReason: null,
    createdAt: now,
    updatedAt: now,
  });
  if (previous) {
    if (previous.remote?.uid !== value.remote.uid) throw new Error("Study session owner changed");
    const previousReference = doc(db, "studySession", previous.sessionId);
    references.push(previousReference);
    batch.update(previousReference, { endReason: "abandoned", endedAt: now, updatedAt: now });
  }
  await writeLocally(value.remote.uid, references, () => batch.commit());
}

export async function updateStudySession(
  session: StudySession,
  endReason: StudySessionWrite["endReason"]
): Promise<void> {
  const value = studySessionSchema.parse(session);
  if (value.remote === undefined) throw new Error("A local study session cannot be written to Firestore");
  const reference = doc(db, "studySession", value.sessionId);
  // Progress never writes active lifecycle fields; a delayed update cannot reopen an ended run.
  await writeLocally(value.remote.uid, [reference], () =>
    updateDoc(reference, {
      ...(endReason === "abandoned" ? {} : { currentIndex: value.currentIndex }),
      ...(endReason === null ? {} : { endReason, endedAt: Timestamp.now() }),
      updatedAt: Timestamp.now(),
    })
  );
}

export async function updateStudySessionRecency(session: StudySession): Promise<void> {
  if (!session.remote) throw new Error("A confirmed owner is required");
  const reference = doc(db, "studySession", session.sessionId);
  await writeLocally(session.remote.uid, [reference], () =>
    updateDoc(reference, { updatedAt: Timestamp.fromMillis(session.lastStudiedAt) })
  );
}

export function subscribeStudySessions(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  setStudySessionOwner(uid);
  return onSnapshot(
    query(collection(db, "studySession"), where("uid", "==", uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
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
      onReady?.();
    },
    (error) => {
      finishStudySessionLoading();
      onError(error);
    }
  );
}
