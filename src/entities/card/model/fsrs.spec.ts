import { createEmptyCard, fsrs as createScheduler, Rating, State, type Card as FsrsCard } from "ts-fsrs";
import { describe, expect, it } from "vitest";
import { calculateFsrsState, classifyFsrsState, getStudyRetrievability } from "./fsrs";
import type { FsrsState } from "./types";

const at = Date.UTC(2026, 8, 22);
const day = 86_400_000;
const reviewed: FsrsState = {
  state: "review",
  dueAt: at + 10 * day,
  stability: 10,
  difficulty: 5,
  lastReviewedAt: at,
  reps: 3,
  lapses: 1,
  scheduledDays: 10,
  learningSteps: 0,
};
const library = createScheduler({
  request_retention: 0.9,
  enable_fuzz: false,
  maximum_interval: 36_500,
  enable_short_term: true,
  learning_steps: ["1m", "10m"],
  relearning_steps: ["10m"],
});
const grades = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy } as const;

// The oracle uses only the pinned library and specification settings, independently of the application adapter.
function referenceState(card: FsrsCard): FsrsState {
  if (card.state === State.New || !card.last_review) throw new Error("The reference card must have been reviewed");
  return {
    state: ({ [State.Learning]: "learning", [State.Review]: "review", [State.Relearning]: "relearning" } as const)[
      card.state
    ],
    dueAt: card.due.getTime(),
    stability: card.stability,
    difficulty: card.difficulty,
    lastReviewedAt: card.last_review.getTime(),
    reps: card.reps,
    lapses: card.lapses,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
  };
}

describe("Card FSRS scheduling", () => {
  it.each(["again", "hard", "good", "easy"] as const)(
    "UNIT-FSRS-SCHEDULING-01 starts learning with the selected %s rating",
    (rating) => {
      // Given: Prepare `expected` and any shared test state below.
      const expected = library.next(createEmptyCard(new Date(at)), at, grades[rating]).card;
      // When: Exercise `calculateFsrsState` with the prepared inputs.
      const result = calculateFsrsState(null, rating, at);

      // Then: Verify the expected result in the assertions below.
      expect(result).toEqual(referenceState(expected));
      expect(result).toMatchObject({ state: rating === "easy" ? "review" : "learning", reps: 1, lapses: 0 });
      expect(result.dueAt).toBeGreaterThan(at);
      expect(result.stability).toBeGreaterThan(0);
      expect(result.difficulty).toBeGreaterThanOrEqual(1);
      expect(result.difficulty).toBeLessThanOrEqual(10);
      expect(calculateFsrsState(null, rating, at)).toEqual(result);
    }
  );

  it.each([
    ["learning", "again", "learning", 0],
    ["learning", "easy", "review", 0],
    ["review", "again", "relearning", 1],
    ["review", "hard", "review", 0],
    ["review", "good", "review", 0],
    ["review", "easy", "review", 0],
    ["relearning", "again", "relearning", 0],
    ["relearning", "good", "review", 0],
    ["relearning", "easy", "review", 0],
  ] as const)(
    "UNIT-FSRS-SCHEDULING-02 updates %s with %s to %s and adds %i lapses",
    (phase, rating, nextPhase, addedLapses) => {
      // Given: Prepare `learning`, `review`, `relearning` and any shared test state below.
      const learning = library.next(createEmptyCard(new Date(at)), at, Rating.Again).card;
      const review = library.next(learning, learning.due, Rating.Easy).card;
      const relearning = library.next(review, review.due, Rating.Again).card;
      const previous = { learning, review, relearning }[phase];
      const input = referenceState(previous);
      const unchanged = structuredClone(input);
      const answeredAt = previous.due.getTime();

      // When: Exercise `calculateFsrsState` with the prepared inputs.
      const result = calculateFsrsState(input, rating, answeredAt);

      // Then: Verify the expected result in the assertions below.
      expect(result).toEqual(referenceState(library.next(previous, answeredAt, grades[rating]).card));
      expect(result).toMatchObject({
        state: nextPhase,
        lapses: input.lapses + addedLapses,
        reps: input.reps + 1,
        lastReviewedAt: answeredAt,
      });
      expect(input).toEqual(unchanged);
    }
  );

  it.each([
    [[], "again"],
    [["again"], "hard"],
    [["again", "hard"], "easy"],
    [["again", "hard", "easy"], "again"],
    [["again", "hard", "easy", "again"], "good"],
  ] as const)("UNIT-FSRS-SCHEDULING-03 continues restored history %j with %s", (history, rating) => {
    // Given: Prepare `previous`, `input`, `unchanged` and any shared test state below.
    let previous = createEmptyCard(new Date(at));
    for (const priorRating of history) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `library.next` with the prepared inputs.
      previous = library.next(previous, previous.due.getTime() + day, grades[priorRating]).card;
      // Then: The invoked verification helper checks the case's expected result.
    }
    const input: FsrsState | null = history.length === 0 ? null : JSON.parse(JSON.stringify(referenceState(previous)));
    const unchanged = structuredClone(input);
    const answeredAt = previous.due.getTime() + day;
    const expected = library.next(previous, answeredAt, grades[rating]).card;

    const result = calculateFsrsState(input, rating, answeredAt);

    // When: Evaluate `referenceState` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(result).toEqual(referenceState(expected));
    expect(calculateFsrsState(input, rating, answeredAt)).toEqual(result);
    expect(input).toEqual(unchanged);
  });

  it.each([
    ["negative answer time", null, -1],
    ["NaN answer time", null, NaN],
    ["fractional answer time", null, at + 0.5],
    ["zero stability", { ...reviewed, stability: 0 }, reviewed.dueAt],
    ["difficulty outside the range", { ...reviewed, difficulty: 11 }, reviewed.dueAt],
    ["lapses exceeding reviews", { ...reviewed, lapses: 4 }, reviewed.dueAt],
  ])("UNIT-FSRS-SCHEDULING-04 rejects %s", (_label, input, answeredAt) => {
    // Given: Prepare `unchanged` and any shared test state below.
    const unchanged = structuredClone(input);
    // When: Evaluate `calculateFsrsState` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() => calculateFsrsState(input, "good", answeredAt)).toThrow();
    expect(input).toEqual(unchanged);
  });
});

describe("Card FSRS classification", () => {
  it("UNIT-FSRS-CLASSIFICATION-01 classifies explicit absence as new", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `classifyFsrsState` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(classifyFsrsState(null, at)).toEqual({ status: "new" });
  });

  it.each(["learning", "review", "relearning"] as const)(
    "UNIT-FSRS-CLASSIFICATION-02 compares the exact deadline during %s",
    (state) => {
      // Given: Prepare `input`, `unchanged` and any shared test state below.
      const input = { ...reviewed, state };
      const unchanged = structuredClone(input);
      // When: Evaluate `classifyFsrsState` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(classifyFsrsState(input, input.dueAt - 1)).toEqual({ status: "future", dueAt: input.dueAt });
      expect(classifyFsrsState(input, input.dueAt)).toEqual({ status: "due", dueAt: input.dueAt });
      expect(classifyFsrsState(input, input.dueAt + 1)).toEqual({ status: "due", dueAt: input.dueAt });
      expect(input).toEqual(unchanged);
    }
  );

  it.each([
    ["missing state", undefined],
    ["empty state", {}],
    ["NaN deadline", { ...reviewed, dueAt: NaN }],
  ])("UNIT-FSRS-CLASSIFICATION-03 rejects %s", (_label, input) => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `classifyFsrsState` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() => classifyFsrsState(input as FsrsState, at)).toThrow();
  });

  it.each([null, reviewed])("UNIT-FSRS-CLASSIFICATION-04 rejects invalid reference times for %j", (input) => {
    // Given: Prepare `unchanged` and any shared test state below.
    const unchanged = structuredClone(input);
    for (const invalidAt of [-1, NaN, at + 0.5]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Evaluate `classifyFsrsState` as part of the following checks.
      // Then: Verify the expected result in the assertions below.
      expect(() => classifyFsrsState(input, invalidAt)).toThrow();
    }
    // When: Observe the prepared result through the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(input).toEqual(unchanged);
  });
});

describe("Card FSRS retrievability", () => {
  it.each([at - 1, at])("UNIT-FSRS-RETRIEVABILITY-01 returns full retrievability at %i", (calculatedAt) => {
    // Given: Prepare `input` and any shared test state below.
    const input = { ...reviewed };
    // When: Exercise `structuredClone` with the prepared inputs.
    const unchanged = structuredClone(input);
    // Then: Verify the expected result in the assertions below.
    expect(getStudyRetrievability(input, calculatedAt)).toBe(1);
    expect(input).toEqual(unchanged);
  });

  it("UNIT-FSRS-RETRIEVABILITY-02 continuously reflects fractional days", () => {
    // Given: Prepare `elapsedTimes`, `previousProbability` and any shared test state below.
    const elapsedTimes = [6 * 60 * 60 * 1000, 12 * 60 * 60 * 1000, day - 1, day];
    let previousProbability = 1;
    for (const elapsed of elapsedTimes) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `getStudyRetrievability` with the prepared inputs.
      const probability = getStudyRetrievability(reviewed, at + elapsed);
      // Then: Verify the expected result in the assertions below.
      expect(Number.isFinite(probability)).toBe(true);
      expect(probability).toBeGreaterThan(0);
      expect(probability).toBeLessThan(1);
      expect(probability).toBeCloseTo(library.forgetting_curve(elapsed / day, 10), 8);
      expect(previousProbability).toBeGreaterThan(probability);
      previousProbability = probability;
    }
    // When: Evaluate `getStudyRetrievability` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(getStudyRetrievability(reviewed, at + day - 1) - getStudyRetrievability(reviewed, at + day)).toBeLessThan(
      1e-6
    );
  });

  it("UNIT-FSRS-RETRIEVABILITY-03 reflects stability relative to ninety percent retention", () => {
    // Given: Prepare `lessStable`, `target` and any shared test state below.
    const lessStable = getStudyRetrievability({ ...reviewed, stability: 5 }, at + 10 * day);
    const target = getStudyRetrievability({ ...reviewed, stability: 10 }, at + 10 * day);
    // When: Exercise `getStudyRetrievability` with the prepared inputs.
    const moreStable = getStudyRetrievability({ ...reviewed, stability: 20 }, at + 10 * day);
    for (const probability of [lessStable, target, moreStable]) {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      expect(Number.isFinite(probability)).toBe(true);
      expect(probability).toBeGreaterThanOrEqual(0);
      expect(probability).toBeLessThanOrEqual(1);
    }
    expect(lessStable).toBeLessThan(0.9);
    expect(target).toBeCloseTo(0.9, 8);
    expect(moreStable).toBeGreaterThan(0.9);
  });

  it.each([
    ["negative calculation time", reviewed, -1],
    ["NaN calculation time", reviewed, NaN],
    ["fractional calculation time", reviewed, at + 0.5],
    ["zero stability", { ...reviewed, stability: 0 }, at + day],
  ])("UNIT-FSRS-RETRIEVABILITY-04 rejects %s", (_label, input, calculatedAt) => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `structuredClone` with the prepared inputs.
    const unchanged = structuredClone(input);
    // Then: Verify the expected result in the assertions below.
    expect(() => getStudyRetrievability(input, calculatedAt)).toThrow();
    expect(input).toEqual(unchanged);
  });
});
