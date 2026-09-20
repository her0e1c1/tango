import { getStudySession, type StudySession } from "@/entities/study-session";
import { updateStudyIndex } from "./updateStudyIndex";

export function advanceStudySession(session: StudySession): void {
  // A timer must not advance a session that has been restarted or moved since scheduling.
  const current = getStudySession(session.deckId);
  if (current?.sessionId === session.sessionId && current.currentIndex === session.currentIndex) {
    void updateStudyIndex(session.deckId, session.currentIndex + 1);
  }
}
