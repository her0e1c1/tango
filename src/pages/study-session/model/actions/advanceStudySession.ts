import { moveStudySession, type StudySession } from "@/entities/study-session";
import { hideBackText } from "./hideBackText";

export function advanceStudySession(session: StudySession): void {
  // A timer must not advance a session that has been restarted or moved since scheduling.
  if (moveStudySession(session, "next")) hideBackText();
}
