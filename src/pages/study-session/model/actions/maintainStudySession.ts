import { getCards } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { getStudySession, resolveStudySession, removeStudySession, touchStudySession } from "@/entities/study-session";

export function maintainStudySession(deckId: DeckId): void {
  const { status } = resolveStudySession(getStudySession(deckId), getCards());
  if (status === "studying") {
    touchStudySession(deckId);
    return;
  }
  if (status === "preparing") return;
  // Remove invalid progress before leaving so reopening the Deck cannot repeat the failure.
  removeStudySession(deckId);
}
