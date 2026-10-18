import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
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

describe("STUDY-SESSION-09 STUDY-SESSION-13 STUDY-SESSION-35 daily study counts", () => {
  it("counts a completed session once in both metrics and includes 30 calendar days", () => {
    // Given: Prepare `started`, `completed` and any shared test state below.
    const started = record(new Date(2026, 8, 21, 10).getTime());
    const completed = record(new Date(2026, 8, 21, 11).getTime());
    // When: Exercise `aggregateStudyHistory` with the prepared inputs.
    const result = aggregateStudyHistory(period, [started], [completed], visible);
    // Then: Verify the expected result in the assertions below.
    expect(result).toMatchObject({ started: 1, completed: 1 });
    expect(result.days).toHaveLength(30);
    expect(result.days.at(-1)).toEqual({ date: new Date(2026, 8, 21).getTime(), started: 1, completed: 1 });
    expect(result.days.slice(0, -1).every((day) => day.started === 0 && day.completed === 0)).toBe(true);
  });

  it("counts independent starts and completions on their own calendar dates", () => {
    // Given: Prepare `started`, `completed` and any shared test state below.
    const started = [
      record(new Date(2026, 8, 20, 23).getTime()),
      record(period.start),
      record(period.end - 1),
      record(period.start),
    ];
    const completed = [record(new Date(2026, 8, 21, 1).getTime()), record(period.start)];
    // When: Exercise `aggregateStudyHistory` with the prepared inputs.
    const result = aggregateStudyHistory(period, started, completed, visible);
    // Then: Verify the expected result in the assertions below.
    expect(result).toMatchObject({ started: 4, completed: 2 });
    expect(result.days[0]).toMatchObject({ started: 2, completed: 1 });
    expect(result.days.at(-2)).toMatchObject({ started: 1, completed: 0 });
    expect(result.days.at(-1)).toMatchObject({ started: 1, completed: 1 });
  });

  it("retains more than 100 records and excludes unavailable decks without displacing visible records", () => {
    // Given: Prepare `records`, `hidden` and any shared test state below.
    const records = Array.from({ length: 130 }, () => record(period.start));
    const hidden = Array.from({ length: 200 }, () => record(period.start, "deleted"));
    // When: Evaluate `aggregateStudyHistory` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(aggregateStudyHistory(period, [...hidden, ...records], hidden, visible)).toMatchObject({
      started: 130,
      completed: 0,
    });
  });

  it.each([new Date(2026, 2, 15), new Date(2026, 10, 10), new Date(2026, 0, 5)])(
    "uses local midnights across month, year and daylight-saving boundaries (%s)",
    (today) => {
      // Given: Prepare `range` and any shared test state below.
      const range = getStudyHistoryPeriod(today);
      // When: Exercise `aggregateStudyHistory` with the prepared inputs.
      const result = aggregateStudyHistory(range, [], [], visible);
      // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `range` and any shared test state below.
    const range = getStudyHistoryRange(new URLSearchParams({ start, end }), new Date(2026, 8, 22)).period;
    if (range === null) throw new Error("Expected a valid custom period");
    // When: Exercise `aggregateStudyHistory` with the prepared inputs.
    const empty = aggregateStudyHistory(range, [], [], visible);
    // Then: Verify the expected result in the assertions below.
    expect(empty.days).toHaveLength(length);
    expect(empty.started).toBe(0);
    expect(empty.completed).toBe(0);
    // When: Exercise `aggregateStudyHistory` with the prepared inputs.
    const result = aggregateStudyHistory(
      range,
      [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
      [record(range.start), record(range.end - 1)],
      visible
    );
    // Then: Verify the expected result in the assertions below.
    expect(result.started).toBe(2);
    expect(result.completed).toBe(2);
    expect(result.days[0]?.date).toBe(new Date(`${start}T00:00:00`).getTime());
    expect(result.days.at(-1)?.date).toBe(new Date(`${end}T00:00:00`).getTime());
  });

  // Register only assertions in the child, so the subprocess cannot launch itself recursively.
  if (process.env.TANGO_STUDY_HISTORY_DST_CHILD === "1") {
    it.each([
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
    ] as const)(
      "spans $hours hours and three New York calendar days in $start–$end",
      ({ start, end, midnights, hours }) => {
        // Given: Use this case's inputs and any shared test setup.
        // Given: Confirm that this subprocess uses the requested New York timezone.
        expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/New_York");
        // When: Exercise `getStudyHistoryRange` with the prepared inputs.
        const range = getStudyHistoryRange(new URLSearchParams({ start, end }), new Date(2026, 8, 22)).period;
        if (range === null) throw new Error("Expected a valid custom period");
        // Then: Verify the expected result in the assertions below.
        expect(range).toEqual({ start: Date.parse(midnights[0]), end: Date.parse(midnights[3]) });
        expect(range.end - range.start).toBe(hours * 60 * 60 * 1000);
        for (const boundary of [range.start, range.end]) {
          // Given: Prepare `date` and any shared test state below.
          const date = new Date(boundary);
          // Then: Verify the expected result in the assertions below.
          expect([date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()]).toEqual([0, 0, 0, 0]);
        }
        // When: Exercise `aggregateStudyHistory` with the prepared inputs.
        const result = aggregateStudyHistory(
          range,
          [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
          [record(range.start - 1), record(range.start), record(range.end - 1), record(range.end)],
          visible
        );
        // Then: Verify the expected result in the assertions below.
        expect(result.days).toHaveLength(3);
        expect(result.days.map((day) => day.date)).toEqual(midnights.slice(0, 3).map((date) => Date.parse(date)));
        expect(result.days.map(({ started, completed }) => ({ started, completed }))).toEqual([
          { started: 1, completed: 1 },
          { started: 0, completed: 0 },
          { started: 1, completed: 1 },
        ]);
        expect(result).toMatchObject({ started: 2, completed: 2 });
      }
    );
  } else {
    it("verifies DST boundaries in a TZ=America/New_York subprocess", () => {
      // Given: Prepare `output` and any shared test state below.
      // When: Run the DST cases in an isolated New York timezone subprocess.
      const output = execFileSync(
        process.execPath,
        [
          join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs"),
          "run",
          "--project=unit",
          fileURLToPath(import.meta.url),
          "--reporter=verbose",
        ],
        {
          env: { ...process.env, TZ: "America/New_York", TANGO_STUDY_HISTORY_DST_CHILD: "1" },
          encoding: "utf8",
          timeout: 30_000,
          killSignal: "SIGKILL",
        }
      );
      console.info(output);
      // Then: Verify the expected result in the assertions below.
      expect(output).toContain("spans 71 hours");
      expect(output).toContain("spans 73 hours");
    }, 35_000);
  }
});
