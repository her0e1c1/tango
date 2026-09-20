import type { StudySession, StudySessionWrite, StudySessionWrites } from "../types";

// Coalesce progress while retaining terminal writes after the active session disappears.
export function queueStudySessionWrite(
  pendingWrites: StudySessionWrites,
  session: StudySession,
  endReason: StudySessionWrite["endReason"] = null
): void {
  if (session.remote === undefined || session.cardOrderIds.length === 0) return;
  if (pendingWrites[session.sessionId]?.endReason != null) return;
  pendingWrites[session.sessionId] = { session: { ...session, cardOrderIds: [...session.cardOrderIds] }, endReason };
}
