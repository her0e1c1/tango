import type { StudySession, StudySessionSummary } from "./types";

export type StudySessionMovement = "previous" | "next";
type StudySessionSummarySource = Pick<StudySession, "cardOrderIds" | "currentIndex" | "lastStudiedAt">;

export const calculateStudySessionIndex = (
  session: StudySession,
  movement: StudySessionMovement
): number | undefined => {
  const nextIndex = session.currentIndex + (movement === "previous" ? -1 : 1);
  return nextIndex >= 0 && nextIndex < session.cardOrderIds.length ? nextIndex : undefined;
};

export const summarizeStudySession = (session: StudySessionSummarySource): StudySessionSummary => ({
  currentIndex: session.currentIndex,
  cardCount: session.cardOrderIds.length,
  lastStudiedAt: session.lastStudiedAt,
});
