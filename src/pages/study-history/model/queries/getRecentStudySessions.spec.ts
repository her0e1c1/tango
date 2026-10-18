import { describe, expect, it } from "vitest";
import type { StudyHistoryRecord } from "@/entities/study-session";
import { createDeck } from "@/test/factories";
import { aggregateStudyHistory } from "./aggregateStudyHistory";
import { getRecentStudySessions } from "./getRecentStudySessions";

const period = { start: new Date(2026, 8, 1).getTime(), end: new Date(2026, 9, 1).getTime() };
const decks = [createDeck({ id: "deck", name: "Current name" })];
function record(
  sessionId: string,
  startedAt: number,
  endedAt: number | null = null,
  endReason: StudyHistoryRecord["endReason"] = null
): StudyHistoryRecord {
  return { sessionId, deckId: "deck", startedAt, endedAt, endReason, cardCount: 3, occurredAt: startedAt };
}

describe("STUDY-SESSION-09 recent study sessions", () => {
  it("shows one completed session from both reads with its current deck name and target card count", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `record` with the prepared inputs.
    const session = record("session", period.start, period.start + 1, "completed");
    // Then: Verify the expected result in the assertions below.
    expect(getRecentStudySessions(period, [session], [session], decks)).toEqual([
      { ...session, deckName: "Current name", latestAt: period.start + 1 },
    ]);
  });

  it("orders cross-day completion and in-period starts without using abandonment times", () => {
    // Given: Prepare `crossDay`, `started` and any shared test state below.
    const crossDay = record("cross-day", period.start + 1, period.start + 86_400_000, "completed");
    const started = [
      record("unfinished", period.start + 2),
      record("abandoned", period.start, period.end - 1, "abandoned"),
      crossDay,
      record("old-abandoned", period.start - 1, period.start + 3, "abandoned"),
      record("end-boundary", period.end),
    ];
    // When: Exercise `record` with the prepared inputs.
    const completed = [
      crossDay,
      record("old-completed", period.start - 1, period.start, "completed"),
      record("outside", period.start - 1, period.end, "completed"),
    ];
    // Then: Verify the expected result in the assertions below.
    expect(getRecentStudySessions(period, started, completed, decks).map((item) => item.sessionId)).toEqual([
      "cross-day",
      "unfinished",
      "abandoned",
      "old-completed",
    ]);
  });

  it("deduplicates asynchronously delivered start and completion snapshots", () => {
    // Given: Prepare `started` and any shared test state below.
    const started = record("session", period.start);
    // When: Exercise `record` with the prepared inputs.
    const completed = record("session", period.start, period.start + 1, "completed");
    // Then: Verify the expected result in the assertions below.
    expect(getRecentStudySessions(period, [started], [completed], decks)).toMatchObject([
      { sessionId: "session", endReason: "completed", endedAt: period.start + 1 },
    ]);
  });

  it("filters before limiting, breaks ties by session ID, and preserves all daily counts", () => {
    // Given: Prepare `visible`, `hidden` and any shared test state below.
    const visible = Array.from({ length: 12 }, (_, index) => record(String(index).padStart(2, "0"), period.start));
    const hidden = Array.from({ length: 15 }, (_, index) => ({
      ...record(`hidden-${String(index)}`, period.end - 1),
      deckId: "deleted",
    }));
    // When: Exercise `visible.toReversed` with the prepared inputs.
    const records = [...hidden, ...visible.toReversed()];
    // Then: Verify the expected result in the assertions below.
    expect(getRecentStudySessions(period, records, [], decks).map((item) => item.sessionId)).toEqual(
      visible.slice(0, 10).map((item) => item.sessionId)
    );
    expect(aggregateStudyHistory(period, records, [], new Set(["deck"]))).toMatchObject({ started: 12, completed: 0 });
    expect(getRecentStudySessions(period, records, [], [])).toEqual([]);
  });
});
