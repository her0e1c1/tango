import {
  collection,
  doc,
  orderBy,
  startAt,
  serverTimestamp,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type WriteBatch,
} from "firebase/firestore";
import { db } from "@/shared/firebase";
import { subscribeSyncedQuery } from "@/shared/api";
import { applyStudySessionSnapshot } from "../model/store";
import { getStudyHistory } from "../model/rules";
import { isStudySessionPositionUnchanged } from "../model/rules";
import { studySessionSchema } from "../model/schema";
import type { StudySession, StudySessionSnapshot, StudyHistoryRecord, StudyHistoryPeriod } from "../model/types";
import { parseStudySessionDocument, toStudySessionDocument, toStudySessionWrite } from "./document";
import { getAuthUid } from "@/entities/auth/@x/study-session";
import { setStudySessionSyncError, getStudySession, studySessionStore, setStudySessionOwner } from "../model/store";

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
    updatedAt: serverTimestamp(),
  });
  if (previous) {
    if (previous.remote.uid !== value.remote.uid) throw new Error("Study session owner changed");
    const previousReference = doc(db, "studySession", previous.sessionId);
    batch.update(previousReference, { endReason: "abandoned", endedAt: now, updatedAt: serverTimestamp() });
  }
  void batch.commit().catch(() => undefined);
}

export function updateStudySession(session: StudySession, endReason: StudySessionSnapshot["endReason"]): void {
  const value = studySessionSchema.parse(session);
  const reference = doc(db, "studySession", value.sessionId);
  // Progress never writes active lifecycle fields; a delayed update cannot reopen an ended run.
  void updateDoc(reference, {
    ...(endReason === "abandoned" ? {} : { currentIndex: value.currentIndex }),
    ...(endReason === null ? {} : { endReason, endedAt: Timestamp.now() }),
    lastStudiedAt: Date.now(),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);
}

export function subscribeStudySessions(uid: string, onError: (error: Error) => void, onReady?: () => void): () => void {
  const scope = JSON.stringify([db.app.options.projectId, uid]);
  setStudySessionOwner(uid);
  return subscribeSyncedQuery({
    scope,
    store: studySessionStore,
    request: (cursor) =>
      query(
        collection(db, "studySession"),
        where("uid", "==", uid),
        orderBy("updatedAt"),
        ...(cursor ? [startAt(new Timestamp(cursor.seconds, cursor.nanoseconds))] : [])
      ),
    parse: (id, data) => {
      const document = parseStudySessionDocument(data);
      return document ? toStudySessionWrite(id, document) : null;
    },
    receive: (result) => {
      const saved = applyStudySessionSnapshot(uid, scope, result);
      onReady?.();
      return saved;
    },
    onError: (error) => {
      if (studySessionStore.getState().ownerUid !== uid) return;
      setStudySessionSyncError(error);
      onError(error);
    },
  });
}

export function writeStudySessionPosition(batch: WriteBatch, session: StudySession, targetIndex: number) {
  const completed = targetIndex === session.cardOrderIds.length;
  const currentIndex = completed ? targetIndex - 1 : targetIndex;
  const endReason = completed ? "completed" : null;
  const reference = doc(db, "studySession", session.sessionId);
  batch.update(reference, {
    currentIndex,
    ...(completed ? { endReason, endedAt: Timestamp.fromMillis(session.lastStudiedAt) } : {}),
    lastStudiedAt: session.lastStudiedAt,
    updatedAt: serverTimestamp(),
  });
  return { session: { ...session, currentIndex }, endReason };
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
  const receive = () => {
    const state = studySessionStore.getState();
    if (state.ownerUid !== uid || state.remoteLoading) return;
    if (state.syncError) {
      onError(state.syncError);
      return;
    }
    onRecords(getStudyHistory(state.history, period, deckId, metric), state.fromCache);
  };
  const stopStore = studySessionStore.subscribe(receive);
  receive();
  return stopStore;
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
  void updateDoc(doc(db, "studySession", session.sessionId), {
    lastStudiedAt: Date.now(),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);
}
