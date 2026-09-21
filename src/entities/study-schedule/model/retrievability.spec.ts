import { describe, expect, it } from "vitest";
import { fsrs } from "ts-fsrs";
import { calculateStudySchedule, getStudyRetrievability } from "./rules";

describe("CARD-VIEW-06 FSRS recall estimates", () => {
  const at = Date.UTC(2026, 8, 21);
  const schedule = calculateStudySchedule(undefined, "good", at);
  it("matches pinned FSRS at fractional days without changing the schedule", () => {
    const before = structuredClone(schedule);
    const scheduler = fsrs({ enable_fuzz: false });
    const times = [0, 60_000, 3_600_000, 86_400_000, 30 * 86_400_000];
    const probabilities = times.map((elapsed) => getStudyRetrievability(schedule, at + elapsed));
    expect(probabilities[0]).toBe(1);
    times.forEach((elapsed, index) => {
      expect(probabilities[index]).toBe(scheduler.forgetting_curve(elapsed / 86_400_000, schedule.stability));
    });
    probabilities.slice(1).forEach((probability, index) => {
      expect(probability).toBeLessThan(Number(probabilities[index]));
    });
    expect(getStudyRetrievability(schedule, at + 60_000)).toBe(probabilities[1]);
    expect(schedule).toEqual(before);
  });
  it("rejects invalid and unsupported schedules instead of inventing recall", () => {
    expect(() => getStudyRetrievability({ ...schedule, stability: 0 }, at)).toThrow();
    expect(() => getStudyRetrievability({ ...schedule, version: 2 } as unknown as typeof schedule, at)).toThrow();
  });
});
