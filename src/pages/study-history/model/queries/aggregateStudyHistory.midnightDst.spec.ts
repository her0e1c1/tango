import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import type { StudyAnswerHistory } from "@/entities/study-answer";
import type { StudyHistoryRecord } from "@/entities/study-session";
import { aggregateStudyAnswers } from "./aggregateStudyAnswers";
import { aggregateStudyHistory } from "./aggregateStudyHistory";
import { getStudyHistoryPeriod } from "./getStudyHistoryPeriod";
import { getStudyHistoryRange } from "./getStudyHistoryRange";

describe("STUDY-SESSION-13 STUDY-SESSION-35 daily aggregation across midnight DST", () => {
  if (process.env.TANGO_STUDY_HISTORY_MIDNIGHT_DST_CHILD === "1") {
    it.each([
      {
        name: "minimal midnight DST range",
        start: "2026-09-06",
        end: "2026-09-07",
        days: ["2026-09-06T01:00:00-03:00", "2026-09-07T00:00:00-03:00"],
      },
      {
        name: "seven-day preset containing midnight DST",
        days: [
          "2026-09-01T00:00:00-04:00",
          "2026-09-02T00:00:00-04:00",
          "2026-09-03T00:00:00-04:00",
          "2026-09-04T00:00:00-04:00",
          "2026-09-05T00:00:00-04:00",
          "2026-09-06T01:00:00-03:00",
          "2026-09-07T00:00:00-03:00",
        ],
      },
      {
        name: "ordinary-day control",
        start: "2026-09-07",
        end: "2026-09-08",
        days: ["2026-09-07T00:00:00-03:00", "2026-09-08T00:00:00-03:00"],
      },
    ])("preserves Session and answer counts for $name", ({ start, end, days }) => {
      // Given: Use the device calendar in Santiago, including its nonexistent September 6 midnight.
      expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe("America/Santiago");
      const period =
        start && end
          ? getStudyHistoryRange(new URLSearchParams({ start, end }), new Date(2026, 8, 8, 12)).period
          : getStudyHistoryPeriod(new Date(2026, 8, 7, 12), 7);
      if (period === null) throw new Error("Expected a valid period");
      const session: StudyHistoryRecord = {
        deckId: "deck",
        sessionId: "session",
        occurredAt: 1788793200000,
        startedAt: 1788793200000,
        endedAt: 1788793260000,
        endReason: "completed",
        cardCount: 1,
      };
      const started = [session];
      const completed = [{ ...session, occurredAt: 1788793260000 }];
      const history: StudyAnswerHistory = {
        records: [{ id: "answer", deckId: "deck", sessionId: "session", answeredAt: 1788793200000, rating: "good" }],
        source: "server",
        truncated: false,
        invalidCount: 0,
        hasPendingWrites: false,
      };
      const before = structuredClone({ period, started, completed, history });
      const visible = new Set(["deck"]);

      // When: Aggregate the same September 7 noon Session and answer over the selected period.
      const sessions = aggregateStudyHistory(period, started, completed, visible);
      const answers = aggregateStudyAnswers(period, history, visible);

      // Then: Every calendar bucket exists and September 7 retains its start, completion, and answer.
      const expectedDates = days.map((day) => Date.parse(day));
      expect.soft(sessions.days.map((day) => day.date)).toEqual(expectedDates);
      expect.soft(answers.days.map((day) => day.date)).toEqual(expectedDates);
      expect.soft(sessions).toMatchObject({ started: 1, completed: 1 });
      expect.soft(sessions.days.find((day) => day.date === 1788750000000)).toEqual({
        date: 1788750000000,
        started: 1,
        completed: 1,
      });
      expect(answers).toMatchObject({ ratedAnswerCount: 1, complete: true });
      expect.soft(answers.days.find((day) => day.date === 1788750000000)).toMatchObject({ ratedAnswerCount: 1 });
      expect.soft(answers.days.reduce((sum, day) => sum + day.ratedAnswerCount, 0)).toBe(1);
      expect(answers.sessions).toMatchObject([{ sessionId: "session", ratedAnswerCount: 1 }]);
      expect(answers.recentDecks).toMatchObject([{ deckId: "deck", ratedAnswerCount: 1 }]);
      expect({ period, started, completed, history }).toEqual(before);
    });
  } else {
    it("verifies midnight DST in a TZ=America/Santiago subprocess", () => {
      // Given: Start a separate process so the timezone is fixed before loading the aggregators.
      const runner = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs");
      // When: Execute the regression and ordinary-day control in Santiago.
      const output = execFileSync(
        process.execPath,
        [runner, "run", "--project=unit", fileURLToPath(import.meta.url), "--reporter=verbose"],
        {
          env: { ...process.env, TZ: "America/Santiago", TANGO_STUDY_HISTORY_MIDNIGHT_DST_CHILD: "1" },
          encoding: "utf8",
          timeout: 30_000,
          killSignal: "SIGKILL",
        }
      );
      console.info(output);
      // Then: Confirm that all three calendar-period cases executed successfully.
      expect(output).toContain("3 passed");
    }, 35_000);
  }
});
