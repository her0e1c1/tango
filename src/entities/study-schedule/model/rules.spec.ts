import { describe, expect, it } from "vitest";
import { createEmptyCard, fsrs, Rating } from "ts-fsrs";
import { studyScheduleSchema, type StudySchedule } from "./schema";
import { calculateStudySchedule, classifyStudySchedule, type StudyScheduleFields } from "./rules";

const now = Date.parse("2026-09-21T00:00:00Z");
const progress = {};

describe("FSRS ratings [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03]", () => {
  it.each([
    ["again", 60_000, "learning", 0.212],
    ["hard", 360_000, "learning", 1.2931],
    ["good", 600_000, "learning", 2.3065],
    ["easy", 8 * 86_400_000, "review", 8.2956],
  ] as const)("initializes %s from an empty memory state", (rating, interval, state, stability) => {
    const result = calculateStudySchedule(undefined, rating, now);
    expect(result).toMatchObject({
      version: 1,
      state,
      dueAt: now + interval,
      stability,
      reps: 1,
      lapses: 0,
      lastReviewedAt: now,
    });
  });

  it.each([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as const)(
    "continues the pinned library state after serialization for rating %s",
    (rating) => {
      const engine = fsrs({
        enable_fuzz: false,
        request_retention: 0.9,
        maximum_interval: 36500,
        enable_short_term: true,
        learning_steps: ["1m", "10m"],
        relearning_steps: ["10m"],
      });
      let expected = createEmptyCard(new Date(now));
      let saved: StudySchedule | undefined;
      for (const [index, grade] of ([Rating.Good, Rating.Good, Rating.Again, rating] as const).entries()) {
        const at = now + index * 86_400_000;
        expected = engine.next(expected, new Date(at), grade).card;
        const names = {
          [Rating.Again]: "again",
          [Rating.Hard]: "hard",
          [Rating.Good]: "good",
          [Rating.Easy]: "easy",
        } as const;
        saved = calculateStudySchedule(saved, names[grade], at);
        saved = studyScheduleSchema.parse(JSON.parse(JSON.stringify(saved)));
        expect(saved).toMatchObject({
          lastReviewedAt: at,
          dueAt: expected.due.getTime(),
          stability: expected.stability,
          difficulty: expected.difficulty,
          reps: expected.reps,
          lapses: expected.lapses,
          learningSteps: expected.learning_steps,
          scheduledDays: expected.scheduled_days,
          elapsedDays: expected.elapsed_days,
        });
      }
    }
  );
});

describe("schedule compatibility [STUDY-SESSION-01]", () => {
  it("distinguishes new, legacy due, future and canonical FSRS deadlines", () => {
    expect(classifyStudySchedule(progress, now)).toEqual({ status: "new" });
    expect(classifyStudySchedule(Object.assign({ schedule: undefined }, { interval: 42 }), now)).toEqual({
      status: "new",
    });
    expect(classifyStudySchedule({ ...progress, nextSeeingAt: new Date(now) }, now)).toEqual({
      status: "due",
      dueAt: now,
    });
    expect(classifyStudySchedule({ ...progress, nextSeeingAt: new Date(now + 1) }, now)).toEqual({
      status: "future",
      dueAt: now + 1,
    });
    const schedule = calculateStudySchedule(undefined, "good", now);
    expect(classifyStudySchedule({ ...progress, schedule, nextSeeingAt: new Date(now - 1) }, now)).toEqual({
      status: "future",
      dueAt: schedule.dueAt,
    });
  });

  it.each([
    { version: 2 },
    { dueAt: NaN },
    { difficulty: 0 },
    { stability: -1 },
    { learningSteps: -1 },
    { state: "unknown" },
    { reps: 0 },
  ])("rejects invalid schedules %o instead of resetting memory", (invalid) => {
    const schedule = { ...calculateStudySchedule(undefined, "good", now), ...invalid };
    expect(() => classifyStudySchedule({ ...progress, schedule } as StudyScheduleFields, now)).toThrow();
  });

  it("rejects invalid legacy dates instead of creating new memory", () => {
    expect(() => classifyStudySchedule({ nextSeeingAt: new Date(NaN) }, now)).toThrow();
  });
});
