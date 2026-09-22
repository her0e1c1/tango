import type { StudyAnswerHistory, StudyAnswerRecord } from "@/entities/study-answer";
import type { StudyHistoryPeriod } from "@/entities/study-session";

function metrics(records: StudyAnswerRecord[]) {
  const ratedAnswerCount = records.length;
  const againCount = records.filter((record) => record.rating === "again").length;
  const recalledCount = ratedAnswerCount - againCount;
  return {
    ratedAnswerCount,
    recalledCount,
    againCount,
    hardCount: records.filter((record) => record.rating === "hard").length,
    goodCount: records.filter((record) => record.rating === "good").length,
    easyCount: records.filter((record) => record.rating === "easy").length,
    recallRate: ratedAnswerCount === 0 ? undefined : recalledCount / ratedAnswerCount,
  };
}

export function aggregateStudyAnswers(
  period: StudyHistoryPeriod,
  history: StudyAnswerHistory,
  visibleDeckIds: Set<string>
) {
  const records = [
    ...new Map(
      history.records
        .filter(
          (record) =>
            visibleDeckIds.has(record.deckId) && record.answeredAt >= period.start && record.answeredAt < period.end
        )
        .map((record) => [record.id, record])
    ).values(),
  ];
  const byDate = new Map<number, StudyAnswerRecord[]>();
  const bySession = new Map<string, StudyAnswerRecord[]>();
  const byDeck = new Map<string, StudyAnswerRecord[]>();
  for (const record of records) {
    const date = new Date(record.answeredAt);
    date.setHours(0, 0, 0, 0);
    for (const [map, key] of [
      [bySession, record.sessionId],
      [byDeck, record.deckId],
    ] as const) {
      const group = map.get(key) ?? [];
      group.push(record);
      map.set(key, group);
    }
    const day = byDate.get(date.getTime()) ?? [];
    day.push(record);
    byDate.set(date.getTime(), day);
  }
  const days: ({ date: number } & ReturnType<typeof metrics>)[] = [];
  for (const date = new Date(period.start); date.getTime() < period.end; date.setDate(date.getDate() + 1)) {
    days.push({ date: date.getTime(), ...metrics(byDate.get(date.getTime()) ?? []) });
  }
  return {
    ...metrics(records),
    // Every metric describes only this fetched interval/subset, including per-session metrics.
    complete:
      history.source === "server" && !history.truncated && history.invalidCount === 0 && !history.hasPendingWrites,
    source: history.source,
    truncated: history.truncated,
    invalidCount: history.invalidCount,
    hasPendingWrites: history.hasPendingWrites,
    days,
    sessions: [...bySession].map(([sessionId, answers]) => ({ sessionId, ...metrics(answers) })),
    recentDecks: [...byDeck]
      .map(([deckId, answers]) => ({
        deckId,
        lastAnsweredAt: Math.max(...answers.map((answer) => answer.answeredAt)),
        ...metrics(answers),
      }))
      .sort((a, b) => b.lastAnsweredAt - a.lastAnsweredAt || a.deckId.localeCompare(b.deckId)),
  };
}
