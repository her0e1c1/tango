import { describe, expect, it } from "vitest";
import { createEmptyCard, fsrs, Rating } from "ts-fsrs";
import { calculateStudySchedule, studyScheduleSchema, type StudySchedule } from "./schedule";
import { buildStudyCardOrder, classifyStudyProgress, recordCardStudyProgress } from "./rules";
import type { StudyProgress } from "./types";

const now = Date.parse("2026-09-21T00:00:00Z");
const card = { id: "card", difficulty: 5, numberOfSeen: 20 };
const progress: StudyProgress = { cardId: "card", difficulty: 5, numberOfSeen: 20 };

describe("FSRS ratings [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03]", () => {
  it.each([
    ["again", 60_000, "learning", 0.212],
    ["hard", 360_000, "learning", 1.2931],
    ["good", 600_000, "learning", 2.3065],
    ["easy", 8 * 86_400_000, "review", 8.2956],
  ] as const)("initializes %s from an empty memory state", (rating, interval, state, stability) => {
    const result = recordCardStudyProgress(card, rating, now);
    expect(result.schedule).toMatchObject({
      version: 1,
      state,
      dueAt: now + interval,
      stability,
      reps: 1,
      lapses: 0,
      lastReviewedAt: now,
    });
    expect(recordCardStudyProgress({ ...card, difficulty: 10, numberOfSeen: 0 }, rating, now).schedule).toEqual(
      result.schedule
    );
    expect(
      recordCardStudyProgress({ ...card, nextSeeingAt: new Date(now + 100), interval: 123 }, rating, now).schedule
    ).toEqual(result.schedule);
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

  it("skips without changing an existing schedule or counting another FSRS review", () => {
    const schedule = calculateStudySchedule(undefined, "good", now);
    const patch = recordCardStudyProgress({ ...card, schedule }, undefined, now + 1);
    expect(patch).not.toHaveProperty("schedule");
    expect({ ...card, schedule, ...patch }.schedule).toEqual(schedule);
    expect(patch.numberOfSeen).toBe(21);
  });
});

describe("schedule compatibility [STUDY-SESSION-01]", () => {
  it("distinguishes new, legacy due, future and canonical FSRS deadlines", () => {
    expect(classifyStudyProgress(progress, now)).toEqual({ status: "new" });
    expect(classifyStudyProgress({ ...progress, interval: 42 }, now)).toEqual({ status: "new" });
    expect(classifyStudyProgress({ ...progress, nextSeeingAt: new Date(now) }, now)).toEqual({
      status: "due",
      dueAt: now,
    });
    expect(classifyStudyProgress({ ...progress, nextSeeingAt: new Date(now + 1) }, now)).toEqual({
      status: "future",
      dueAt: now + 1,
    });
    const schedule = calculateStudySchedule(undefined, "good", now);
    expect(classifyStudyProgress({ ...progress, schedule, nextSeeingAt: new Date(now - 1) }, now)).toEqual({
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
    expect(() => classifyStudyProgress({ ...progress, schedule } as StudyProgress, now)).toThrow();
  });

  it("rejects invalid legacy dates instead of creating new memory", () => {
    expect(() => recordCardStudyProgress({ ...card, nextSeeingAt: new Date(NaN) }, "good", now)).toThrow();
  });

  it.each([false, true])("limits the oldest due cards before shuffling=%s", (shuffled) => {
    const cards = [
      { ...card, id: "new" },
      { ...card, id: "equal", nextSeeingAt: new Date(now) },
      { ...card, id: "oldest", nextSeeingAt: new Date(now - 2) },
      { ...card, id: "tie", nextSeeingAt: new Date(now - 2) },
      { ...card, id: "future", nextSeeingAt: new Date(now + 1) },
    ];
    expect(
      new Set(buildStudyCardOrder(cards, { useCardInterval: true, shuffled, maxNumberOfCardsToLearn: 2 }, now))
    ).toEqual(new Set(["oldest", "tie"]));
    expect(
      buildStudyCardOrder(cards, { useCardInterval: true, shuffled: false, maxNumberOfCardsToLearn: 0 }, now)
    ).toEqual(["oldest", "tie", "equal", "new"]);
    expect(
      buildStudyCardOrder(cards, { useCardInterval: false, shuffled: false, maxNumberOfCardsToLearn: 0 }, now)
    ).toEqual(cards.map(({ id }) => id));
  });
});
