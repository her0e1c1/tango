import { getAuthUid } from "@/entities/auth/@x/study-session";
import { getStudySession } from "../model/queries/getStudySession";
import { isStudySessionPositionUnchanged } from "../model/rules";
import type { StudySession } from "../model/types";
import { createStudySession, updateStudySession, updateStudySessionRecency } from "./firestore";

function requireOwner(session: StudySession): void {
  if (session.remote.uid !== getAuthUid()) throw new Error("Study session owner changed");
}

export async function startStudy({
  deckId,
  cardOrderIds,
  uid,
  now = Date.now(),
}: {
  deckId: string;
  cardOrderIds: string[];
  uid: string;
  now?: number;
}): Promise<void> {
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
  await createStudySession(session, previous);
}

export async function setStudySessionIndex(deckId: string, currentIndex: number): Promise<boolean> {
  const session = getStudySession(deckId);
  if (
    !(session && Number.isInteger(currentIndex)) ||
    currentIndex <= session.currentIndex ||
    currentIndex >= session.cardOrderIds.length
  )
    return false;
  requireOwner(session);
  await updateStudySession({ ...session, currentIndex }, null);
  return true;
}

export async function moveStudySession(previous: StudySession): Promise<boolean> {
  const current = getStudySession(previous.deckId);
  if (!isStudySessionPositionUnchanged(previous, current)) return false;
  requireOwner(previous);
  const completed = previous.currentIndex + 1 === previous.cardOrderIds.length;
  await updateStudySession(
    { ...previous, currentIndex: completed ? previous.currentIndex : previous.currentIndex + 1 },
    completed ? "completed" : null
  );
  return true;
}

export async function abandonStudySession(deckId: string): Promise<void> {
  const session = getStudySession(deckId);
  if (!session) return;
  requireOwner(session);
  await updateStudySession(session, "abandoned");
}

export async function touchStudySession(deckId: string): Promise<void> {
  const session = getStudySession(deckId);
  if (!session) return;
  requireOwner(session);
  await updateStudySessionRecency({ ...session, lastStudiedAt: Date.now() });
}
