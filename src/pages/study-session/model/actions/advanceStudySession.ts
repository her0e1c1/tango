import type { StudySession } from "@/entities/study-session";
import { getStudySession } from "@/entities/study-session";
import { updateStudyIndex } from "./updateStudyIndex";

export function advanceStudySession(session: StudySession): void {
  const current = getStudySession(session.deckId);
  if (current?.sessionId !== session.sessionId || current.currentIndex !== session.currentIndex) return;
  void updateStudyIndex(session.deckId, session.currentIndex + 1);
}
