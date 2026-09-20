import { getAuthUid } from "@/entities/auth/@x/study-session";
import { restoreStudySession } from "../model/actions/restoreStudySession";
import { removeStudySession } from "../model/actions/removeStudySession";
import { startStudy as startLocal } from "../model/actions/startStudy";
import { getStudySession } from "../model/queries/getStudySession";
import { isStudySessionPositionUnchanged } from "../model/rules";
import type { StudySession } from "../model/types";
import { createStudySession, updateStudySession, updateStudySessionRecency } from "./firestore";

function requireOwner(session: StudySession): void {
  if (!session.remote?.uid || session.remote.uid !== getAuthUid()) throw new Error("Study session owner changed");
}

export async function startStudy(
  deckId: string,
  cards: Parameters<typeof startLocal>[1],
  preferences: Parameters<typeof startLocal>[2],
  uid: string
): Promise<void> {
  if (!uid || uid !== getAuthUid()) throw new Error("Study session owner changed");
  const previous = getStudySession(deckId);
  if (previous) requireOwner(previous);
  startLocal(deckId, cards, preferences, uid);
  const session = getStudySession(deckId);
  if (!session) throw new Error("Study session was not created");
  try {
    await createStudySession(session, previous);
  } catch (error) {
    if (getAuthUid() === uid && getStudySession(deckId)?.sessionId === session.sessionId) {
      if (previous) restoreStudySession(previous);
      else removeStudySession(deckId);
    }
    throw error;
  }
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
