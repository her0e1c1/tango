import { moveStudySession, type StudySession } from "@/entities/study-session";

export const advanceStudySession = (session: StudySession, onAdvance: () => void): void => {
  // A timer must not advance a session that has been restarted or moved since scheduling.
  if (moveStudySession(session, "next")) onAdvance();
};
