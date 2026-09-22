import "@/test/mockFirestorePersistence";
import { describe, expect, it, vi } from "vitest";
import { calculateFsrsState, getStudyRetrievability, studyRetentionTarget } from "@/entities/card-study-state";
import { getMemoryState } from "./getMemoryState";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

describe("CARD-VIEW-06 memory chart snapshot", () => {
  const at = Date.UTC(2026, 8, 21);
  const schedule = calculateFsrsState(null, "good", at);
  it.each([at + 60_000, schedule.dueAt, at + 100_000 * 86_400_000])(
    "keeps exact markers and bounded samples at %s",
    (now) => {
      const state = getMemoryState(schedule, now);
      if (state === undefined) throw new Error("Expected memory state");
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
  it("leaves missing FSRS state empty", () => {
    expect(getMemoryState(null, at)).toBeUndefined();
  });
});
