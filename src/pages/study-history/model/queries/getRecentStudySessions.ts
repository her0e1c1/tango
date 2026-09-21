import type { Deck } from "@/entities/deck";
import type { StudyHistoryPeriod, StudyHistoryRecord } from "@/entities/study-session";

export function getRecentStudySessions(
  period: StudyHistoryPeriod,
  started: StudyHistoryRecord[],
  completed: StudyHistoryRecord[],
  decks: Deck[]
) {
  const deckNames = new Map(decks.map((deck) => [deck.id, deck.name]));
  const sessions = new Map<string, StudyHistoryRecord & { deckName: string; latestAt: number }>();
  const inPeriod = (date: number) => date >= period.start && date < period.end;
  for (const record of [...started, ...completed]) {
    const deckName = deckNames.get(record.deckId);
    if (deckName === undefined) continue;
    const dates = [
      ...(inPeriod(record.startedAt) ? [record.startedAt] : []),
      ...(record.endReason === "completed" && record.endedAt !== null && inPeriod(record.endedAt)
        ? [record.endedAt]
        : []),
    ];
    if (dates.length === 0) continue;
    const latestAt = Math.max(...dates);
    const previous = sessions.get(record.sessionId);
    // The completion read may arrive before the start read reflects the same completion.
    if (!previous || latestAt >= previous.latestAt) sessions.set(record.sessionId, { ...record, deckName, latestAt });
  }
  return [...sessions.values()]
    .sort((a, b) => b.latestAt - a.latestAt || (a.sessionId < b.sessionId ? -1 : a.sessionId > b.sessionId ? 1 : 0))
    .slice(0, 10);
}
