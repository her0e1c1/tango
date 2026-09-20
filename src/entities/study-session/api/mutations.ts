import { getAuthUid } from "@/entities/auth/@x/study-session";
import { showToast } from "@/shared/ui/toast";
import { removeStudySession } from "../model/actions/removeStudySession";
import { moveStudySession as moveLocal } from "../model/actions/moveStudySession";
import { setStudySessionIndex as setLocalIndex } from "../model/actions/setStudySessionIndex";
import { startStudy as startLocal } from "../model/actions/startStudy";
import { getStudySession } from "../model/queries/getStudySession";
import type { StudySession, StudySessionWrite } from "../model/types";
import { createStudySession, updateStudySession } from "./firestore";

function persist(session: StudySession | undefined, operation: "create" | StudySessionWrite["endReason"]): void {
  const uid = session?.remote?.uid;
  if (session === undefined || uid === undefined || uid !== getAuthUid()) return;
  // Enqueue immediately in Firestore's persistent cache; navigation does not own this write's lifetime.
  const write = operation === "create" ? createStudySession(session) : updateStudySession(session, operation);
  void write.catch(() => {
    if (getAuthUid() === uid) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
  });
}

export function startStudy(
  deckId: string,
  cards: Parameters<typeof startLocal>[1],
  preferences: Parameters<typeof startLocal>[2],
  uid?: string
): void {
  const previous = getStudySession(deckId);
  startLocal(deckId, cards, preferences, uid);
  persist(previous, "abandoned");
  persist(getStudySession(deckId), "create");
}

export function setStudySessionIndex(deckId: string, currentIndex: number): boolean {
  const updated = setLocalIndex(deckId, currentIndex);
  if (updated) persist(getStudySession(deckId), null);
  return updated;
}

export function moveStudySession(previous: StudySession): boolean {
  if (!moveLocal(previous)) return false;
  const current = getStudySession(previous.deckId);
  persist(current ?? previous, current === undefined ? "completed" : null);
  return true;
}

export function abandonStudySession(deckId: string): void {
  const previous = getStudySession(deckId);
  removeStudySession(deckId);
  persist(previous, "abandoned");
}
