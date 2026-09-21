import { getAuthUid } from "@/entities/auth/@x/study-session";
import {
  buildStudyCardOrder,
  type CardProgressFields,
  type StudyCardOrderOptions,
} from "@/entities/study-progress/@x/study-session";
import { getStudySession } from "../model/queries/getStudySession";
import { isStudySessionPositionUnchanged } from "../model/rules";
import type { StudySession } from "../model/types";
import { createStudySession, updateStudySession, updateStudySessionRecency } from "./firestore";

function requireOwner(session: StudySession): void {
  if (session.remote.uid !== getAuthUid()) throw new Error("Study session owner changed");
}

export async function startStudy(
  deckId: string,
  cards: CardProgressFields[],
  preferences: StudyCardOrderOptions,
  uid: string
): Promise<void> {
  if (!uid || uid !== getAuthUid()) throw new Error("Study session owner changed");
  const previous = getStudySession(deckId);
  if (previous) requireOwner(previous);
  const now = Date.now();
  const session: StudySession = {
    sessionId: crypto.getRandomValues(new Uint32Array(4)).join("-"),
    deckId,
    cardOrderIds: buildStudyCardOrder(cards, preferences),
    currentIndex: 0,
    lastStudiedAt: now,
    remote: { uid, startedAt: now },
  };
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
