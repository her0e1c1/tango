import {
  collection,
  doc,
  onSnapshot,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "@/shared/firebase";
import { compareStudySessionCreation, isStudySessionPositionUnchanged } from "../model/rules";
import { studySessionSchema } from "../model/schema";
import type { StudySession } from "../model/types";
import {
  parseStudySessionDocument,
  toStudySessionDocument,
  toStudySessionWrite,
  type StudySessionWrite,
} from "./document";
import { getAuthUid } from "@/entities/auth/@x/study-session";
import {
  finishStudySessionLoading,
  getStudySession,
  replaceRemoteStudySessions,
  setStudySessionOwner,
} from "../model/store";

// Writes are queued locally; callers do not wait for server acknowledgement, including offline.
function createStudySession(session: StudySession, previous?: StudySession): void {
  const value = studySessionSchema.parse(session);
  const reference = doc(db, "studySession", value.sessionId);
  const now = Timestamp.now();
  const batch = writeBatch(db);
  batch.set(reference, {
    ...toStudySessionDocument(value),
    endedAt: null,
    endReason: null,
    createdAt: now,
    updatedAt: now,
  });
  if (previous) {
    if (previous.remote.uid !== value.remote.uid) throw new Error("Study session owner changed");
    const previousReference = doc(db, "studySession", previous.sessionId);
    batch.update(previousReference, { endReason: "abandoned", endedAt: now, updatedAt: now });
  }
  void batch.commit().catch(() => undefined);
}

export function updateStudySession(session: StudySession, endReason: StudySessionWrite["endReason"]): void {
  const value = studySessionSchema.parse(session);
  const reference = doc(db, "studySession", value.sessionId);
  // Progress never writes active lifecycle fields; a delayed update cannot reopen an ended run.
  void updateDoc(reference, {
    ...(endReason === "abandoned" ? {} : { currentIndex: value.currentIndex }),
    ...(endReason === null ? {} : { endReason, endedAt: Timestamp.now() }),
    updatedAt: Timestamp.now(),
  }).catch(() => undefined);
}

export function subscribeStudySessions(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  setStudySessionOwner(uid);
  return onSnapshot(
    query(collection(db, "studySession"), where("uid", "==", uid)),
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
  return { session: { ...session, currentIndex }, endReason };
}

export interface StudyHistoryRecord {
  sessionId: string;
  deckId: string;
  startedAt: number;
  endedAt: number | null;
  endReason: "completed" | "abandoned" | null;
  cardCount: number;
  occurredAt: number;
}

export interface StudyHistoryPeriod {
  start: number;
  end: number;
}

export function subscribeStudyHistory(
  {
    uid,
    period,
    deckId,
    metric,
  }: { uid: string; period: StudyHistoryPeriod; deckId: string | null; metric: "started" | "completed" },
  onRecords: (records: StudyHistoryRecord[], fromCache: boolean) => void,
  onError: (error: Error) => void
): () => void {
  const field = metric === "started" ? "startedAt" : "endedAt";
  return onSnapshot(
    query(
      collection(db, "studySession"),
      where("uid", "==", uid),
      ...(deckId === null ? [] : [where("deckId", "==", deckId)]),
      ...(metric === "completed" ? [where("endReason", "==", "completed")] : []),
      where(field, ">=", Timestamp.fromMillis(period.start)),
      where(field, "<", Timestamp.fromMillis(period.end))
    ),
    { includeMetadataChanges: true },
    (snapshot) => {
      const records = snapshot.docs.flatMap((item) => {
        // Estimates also permit legacy pending server timestamps to appear before acknowledgement.
        const value = parseStudySessionDocument(item.data({ serverTimestamps: "estimate" }));
        if (value === undefined) return [];
        const occurredAt = metric === "started" ? value.startedAt : value.endedAt;
        return occurredAt === null
          ? []
          : [
              {
                sessionId: item.id,
                deckId: value.deckId,
                startedAt: value.startedAt.seconds * 1000 + value.startedAt.nanoseconds / 1_000_000,
                endedAt:
                  value.endedAt === null ? null : value.endedAt.seconds * 1000 + value.endedAt.nanoseconds / 1_000_000,
                endReason: value.endReason,
                cardCount: value.cardOrderIds.length,
                occurredAt: occurredAt.toDate().getTime(),
              },
            ];
      });
      onRecords(records, snapshot.metadata.fromCache);
    },
    onError
  );
}
function requireOwner(session: StudySession): void {
  if (session.remote.uid !== getAuthUid()) throw new Error("Study session owner changed");
}

export function startStudy({
  deckId,
  cardOrderIds,
  uid,
  now = Date.now(),
}: {
  deckId: string;
  cardOrderIds: string[];
  uid: string;
  now?: number;
}): string | undefined {
  if (!uid || uid !== getAuthUid()) throw new Error("Study session owner changed");
  const previous = getStudySession(deckId);
  if (previous) requireOwner(previous);
  const session: StudySession = {
    sessionId: crypto.getRandomValues(new Uint32Array(4)).join("-"),
    deckId,
    cardOrderIds: [...cardOrderIds],
    currentIndex: 0,
    lastStudiedAt: now,
    remote: { uid, startedAt: now },
  };
  if (session.cardOrderIds.length === 0) return;
  createStudySession(session, previous);
  return session.sessionId;
}

export function setStudySessionIndex(deckId: string, currentIndex: number): boolean {
  const session = getStudySession(deckId);
  if (
    !(session && Number.isInteger(currentIndex)) ||
    currentIndex <= session.currentIndex ||
    currentIndex >= session.cardOrderIds.length
  )
    return false;
  requireOwner(session);
  updateStudySession({ ...session, currentIndex }, null);
  return true;
}

export function moveStudySession(previous: StudySession): boolean {
  const current = getStudySession(previous.deckId);
  if (!isStudySessionPositionUnchanged(previous, current)) return false;
  requireOwner(previous);
  const completed = previous.currentIndex + 1 === previous.cardOrderIds.length;
  updateStudySession(
    { ...previous, currentIndex: completed ? previous.currentIndex : previous.currentIndex + 1 },
    completed ? "completed" : null
  );
  return true;
}

export function abandonStudySession(deckId: string): void {
  const session = getStudySession(deckId);
  if (!session) return;
  requireOwner(session);
  updateStudySession(session, "abandoned");
}

export function touchStudySession(deckId: string): void {
  const session = getStudySession(deckId);
  if (!session) return;
  requireOwner(session);
  void updateDoc(doc(db, "studySession", session.sessionId), { updatedAt: Timestamp.now() }).catch(() => undefined);
}
