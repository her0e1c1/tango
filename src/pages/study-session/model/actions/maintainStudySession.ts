import type { DeckId } from "@/entities/deck";
import { removeStudySession, touchStudySession } from "@/entities/study-session";
import type { StudySessionState } from "../types";

export const maintainStudySession = (deckId: DeckId, status: StudySessionState["status"]): void => {
  if (status === "studying") {
    touchStudySession(deckId);
    return;
  }
  if (status === "preparing") return;
  // Remove invalid progress before leaving so reopening the Deck cannot repeat the failure.
  removeStudySession(deckId);
};
