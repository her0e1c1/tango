import type { StudyHistoryPeriod, StudyHistoryRecord } from "@/entities/study-session";

export function aggregateStudyHistory(
  period: StudyHistoryPeriod,
  started: StudyHistoryRecord[],
  completed: StudyHistoryRecord[],
  visibleDeckIds: Set<string>
) {
  const days: { date: number; started: number; completed: number }[] = [];
  // Advance calendar dates rather than 24-hour durations across daylight-saving changes.
  for (const date = new Date(period.start); date.getTime() < period.end; date.setDate(date.getDate() + 1)) {
    days.push({ date: date.getTime(), started: 0, completed: 0 });
  }
  const byDate = new Map(days.map((day) => [day.date, day]));
  function count(records: StudyHistoryRecord[], metric: "started" | "completed") {
    for (const record of records) {
      if (!visibleDeckIds.has(record.deckId)) continue;
      if (metric === "completed" && record.endReason !== "completed") continue;
      const timestamp = metric === "started" ? record.startedAt : record.endedAt;
      if (timestamp === null || timestamp < period.start || timestamp >= period.end) continue;
      const date = new Date(timestamp);
      date.setHours(0, 0, 0, 0);
      const day = byDate.get(date.getTime());
      if (day) day[metric] += 1;
    }
  }
  count(started, "started");
  count(completed, "completed");
  return {
    days,
    started: days.reduce((sum, day) => sum + day.started, 0),
    completed: days.reduce((sum, day) => sum + day.completed, 0),
  };
}
