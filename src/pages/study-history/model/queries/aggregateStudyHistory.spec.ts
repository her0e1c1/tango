import { describe, expect, it } from "vitest";
import type { StudyHistoryRecord } from "@/entities/study-session";
import { aggregateStudyHistory } from "./aggregateStudyHistory";
import { getStudyHistoryPeriod } from "./getStudyHistoryPeriod";
import { getStudyHistoryRange } from "./getStudyHistoryRange";

const period = getStudyHistoryPeriod(new Date(2026, 8, 21, 15));
const record = (occurredAt: number, deckId = "deck"): StudyHistoryRecord => ({
  deckId,
  occurredAt,
  sessionId: "session",
  startedAt: occurredAt,
  endedAt: null,
  endReason: null,
  cardCount: 1,
});
const visible = new Set(["deck"]);

describe("STUDY-SESSION-09 STUDY-SESSION-13 daily study counts", () => {
  it("counts a completed session once in both metrics and includes 30 calendar days", () => {
    const started = record(new Date(2026, 8, 21, 10).getTime());
    const completed = record(new Date(2026, 8, 21, 11).getTime());
    const result = aggregateStudyHistory(period, [started], [completed], visible);
    expect(result).toMatchObject({ started: 1, completed: 1 });
    expect(result.days).toHaveLength(30);
    expect(result.days.at(-1)).toEqual({ date: new Date(2026, 8, 21).getTime(), started: 1, completed: 1 });
    expect(result.days.slice(0, -1).every((day) => day.started === 0 && day.completed === 0)).toBe(true);
  });

  it("counts independent starts and completions on their own calendar dates", () => {
    const started = [
      record(new Date(2026, 8, 20, 23).getTime()),
      record(period.start),
      record(period.end - 1),
      record(period.start),
    ];
    const completed = [record(new Date(2026, 8, 21, 1).getTime()), record(period.start)];
    const result = aggregateStudyHistory(period, started, completed, visible);
    expect(result).toMatchObject({ started: 4, completed: 2 });
    expect(result.days[0]).toMatchObject({ started: 2, completed: 1 });
    expect(result.days.at(-2)).toMatchObject({ started: 1, completed: 0 });
    expect(result.days.at(-1)).toMatchObject({ started: 1, completed: 1 });
  });

  it("retains more than 100 records and excludes unavailable decks without displacing visible records", () => {
    const records = Array.from({ length: 130 }, () => record(period.start));
    const hidden = Array.from({ length: 200 }, () => record(period.start, "deleted"));
    expect(aggregateStudyHistory(period, [...hidden, ...records], hidden, visible)).toMatchObject({
      started: 130,
      completed: 0,
    });
  });

  it.each([new Date(2026, 2, 15), new Date(2026, 10, 10), new Date(2026, 0, 5)])(
    "uses local midnights across month, year and daylight-saving boundaries (%s)",
    (today) => {
      const range = getStudyHistoryPeriod(today);
      const result = aggregateStudyHistory(range, [], [], visible);
      expect(result.days).toHaveLength(30);
      expect(new Date(range.start).getHours()).toBe(0);
      expect(new Date(range.end).getHours()).toBe(0);
      expect(result.days.at(-1)?.date).toBe(today.getTime());
    }
  );

  it.each([
    ["2020-12-31", "2021-01-02", 3],
    ["2024-02-28", "2024-03-01", 3],
    ["2026-03-07", "2026-03-09", 3],
    ["2025-11-01", "2025-11-03", 3],
    ["2026-01-01", "2026-01-01", 1],
  ] as const)("includes both local date boundaries in %s–%s", (start, end, length) => {
    const range = getStudyHistoryRange(new URLSearchParams({ start, end }), new Date(2026, 8, 22)).period;
    if (range === null) throw new Error("Expected a valid custom period");
    const empty = aggregateStudyHistory(range, [], [], visible);
    expect(empty.days).toHaveLength(length);
    expect(empty.started).toBe(0);
    expect(empty.completed).toBe(0);
    const result = aggregateStudyHistory(
      range,
      [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
      [record(range.start), record(range.end - 1)],
      visible
    );
    expect(result.started).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.days[0]?.date).toBe(new Date(`${start}T00:00:00`).getTime());
    expect(result.days.at(-1)?.date).toBe(new Date(`${end}T00:00:00`).getTime());
  });

  // The dedicated CI run starts in New York; ordinary unit runs retain the host timezone.
  it.runIf(Intl.DateTimeFormat().resolvedOptions().timeZone === "America/New_York").each([
    {
      start: "2026-03-07",
      end: "2026-03-09",
      hours: 71,
      midnights: [
        "2026-03-07T00:00:00-05:00",
        "2026-03-08T00:00:00-05:00",
        "2026-03-09T00:00:00-04:00",
        "2026-03-10T00:00:00-04:00",
      ],
    },
    {
      start: "2025-11-01",
      end: "2025-11-03",
      hours: 73,
      midnights: [
        "2025-11-01T00:00:00-04:00",
        "2025-11-02T00:00:00-04:00",
        "2025-11-03T00:00:00-05:00",
        "2025-11-04T00:00:00-05:00",
      ],
    },
  ] as const)("spans $hours hours and three New York calendar days in $start–$end", ({ start, end, midnights, hours }) => {
    const range = getStudyHistoryRange(new URLSearchParams({ start, end }), new Date(2026, 8, 22)).period;
    if (range === null) throw new Error("Expected a valid custom period");
    expect(range).toEqual({ start: Date.parse(midnights[0]), end: Date.parse(midnights[3]) });
    expect(range.end - range.start).toBe(hours * 60 * 60 * 1000);
    for (const boundary of [range.start, range.end]) {
      const date = new Date(boundary);
      expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual([0, 0, 0, 0]);
    }
    const result = aggregateStudyHistory(
      range,
      [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
      [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
      visible
    );
    expect(result.days).toHaveLength(3);
    expect(result.days.map((day) => day.date)).toEqual(midnights.slice(0, 3).map((date) => Date.parse(date)));
    expect(result.days.map(({ started, completed }) => ({ started, completed }))).toEqual([
      { started: 1, completed: 1 },
      { started: 0, completed: 0 },
      { started: 1, completed: 1 },
    ]);
    expect(result).toMatchObject({ started: 2, completed: 2 });
  });
});
