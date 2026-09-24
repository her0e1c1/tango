import type { StudyHistoryPeriod, StudyHistoryRecord, StudySessionSnapshot } from "../types";

export function getStudyHistory(
  history: StudySessionSnapshot[],
  period: StudyHistoryPeriod,
  deckId: string | null,
  metric: "started" | "completed"
): StudyHistoryRecord[] {
  return history.flatMap(({ session, endReason, endedAt }) => {
    if (deckId !== null && session.deckId !== deckId) return [];
    if (metric === "completed" && endReason !== "completed") return [];
    const occurredAt = metric === "started" ? session.remote.startedAt : endedAt;
    if (occurredAt === null || occurredAt < period.start || occurredAt >= period.end) return [];
    return [
      {
        sessionId: session.sessionId,
        deckId: session.deckId,
        startedAt: session.remote.startedAt,
        endedAt,
        endReason,
        cardCount: session.cardOrderIds.length,
        occurredAt,
      },
    ];
  });
}
