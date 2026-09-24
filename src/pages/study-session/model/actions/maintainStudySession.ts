import { getAuthUid } from "@/entities/auth";
import { showToast } from "@/shared/ui/toast";
import { getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getStudySession, resolveStudySession, touchStudySession } from "@/entities/study-session";

export function maintainStudySession(deckId: DeckId): void {
  const session = getStudySession(deckId);
  if (!session) return;
  const { status } = resolveStudySession(session, getCards());
  // Missing Cards may reflect a partial cache; reads must not erase resumable progress.
  if (status !== "studying") return;
  const uid = getAuthUid();
  try {
    touchStudySession(deckId);
  } catch {
    if (getAuthUid() === uid) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
  }
}
