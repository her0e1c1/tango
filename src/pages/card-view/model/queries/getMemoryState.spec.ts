import "@/test/mockFirestorePersistence";
import { describe, expect, it, vi } from "vitest";
import { calculateFsrsState, getStudyRetrievability, studyRetentionTarget } from "@/entities/card";
import { getMemoryState } from "./getMemoryState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-06 CARD-VIEW-08 memory chart snapshot", () => {
  const at = Date.UTC(2026, 8, 21);
  const schedule = calculateFsrsState(null, "good", at);
  it.each([at + 60_000, schedule.dueAt, at + 100_000 * 86_400_000])(
    "keeps exact markers and bounded samples at %s",
    (now) => {
      // Given: Use this case's inputs and any shared test setup.
      // When: Exercise `getMemoryState` with the prepared inputs.
      const state = getMemoryState(schedule, now);
      if (state === undefined) throw new Error("Expected memory state");
      // Then: Verify the expected result in the assertions below.
      expect(state.points.length).toBeLessThanOrEqual(200);
      expect(state.points.find((point) => point.time === now)?.probability).toBe(state.retrievability);
      expect(state.points.find((point) => point.time === schedule.dueAt)?.probability).toBe(state.dueRetrievability);
      expect(state.retrievability).toBe(getStudyRetrievability(schedule, now));
      expect(state.isDue).toBe(schedule.dueAt <= now);
      expect(state.end).toBeGreaterThan(Math.max(now, schedule.dueAt));
      expect(state.start).toBe(at);
      expect(state.target).toBe(studyRetentionTarget);
      expect(state.dueRetrievability).not.toBe(state.target);
      expect(state.dueAt).toBe(schedule.dueAt);
    }
  );
  it("keeps a returning card's curve chronological with its saved markers inside the window", () => {
    // Given: Prepare `now` and any shared test state below.
    const now = Date.UTC(2026, 8, 21, 1);
    // When: Exercise `getMemoryState` with the prepared inputs.
    const state = getMemoryState(schedule, now);
    if (state === undefined) throw new Error("Expected memory state");

    // Then: Verify the expected result in the assertions below.
    expect(state.points.map(({ time }) => time)).toEqual(expect.arrayContaining([at, now, schedule.dueAt]));
    let previousTime = Number.NEGATIVE_INFINITY;
    for (const point of state.points) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      expect(point.time).toBeGreaterThan(previousTime);
      expect(point.time).toBeGreaterThanOrEqual(state.start);
      expect(point.time).toBeLessThanOrEqual(state.end);
      previousTime = point.time;
    }
  });
  it("leaves missing FSRS state empty", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `getMemoryState` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(getMemoryState(null, at)).toBeUndefined();
  });
});
