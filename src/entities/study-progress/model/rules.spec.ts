import { describe, expect, it } from "vitest";

import {
  compareStudyProgress,
  createStudyProgressFromCard,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
  recordStudyProgress,
  type StudyProgress,
  type StudyProgressEdit,
  type StudyRating,
} from "../index";

const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

describe("createStudyProgressFromCard", () => {
  it("allows editing selected progress fields while retaining the card id", () => {
    const edit: StudyProgressEdit = {
      cardId: "card-id",
      score: 3,
      lastSeenAt: 1_786_512_000_000,
    };

    expect(edit).toEqual({
      cardId: "card-id",
      score: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });

  it("restores progress from a Card without copying Card content", () => {
    const card = {
      id: "card-id",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
      frontText: "not part of progress",
    };
    const progress = createStudyProgressFromCard(card);

    expect(progress).toEqual({
      cardId: "card-id",
      score: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
    });
    expect(progress).not.toHaveProperty("frontText");
  });
});

describe("recordStudyProgress", () => {
  it.each<[number, StudyRating, number]>([
    [0, "mastered", 1],
    [3, "mastered", 4],
    [-1, "mastered", 0],
    [0, "not-mastered", -1],
    [-2, "not-mastered", -3],
    [2, "not-mastered", 0],
    [3, "unrated", 3],
  ])("updates score %i for a %s rating", (score, rating, expectedScore) => {
    const progress = { ...initialStudyProgress("card-id"), score, numberOfSeen: 2 };

    expect(recordStudyProgress(progress, rating, 1_786_512_000_000)).toEqual({
      cardId: "card-id",
      score: expectedScore,
      numberOfSeen: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });
});

describe("study progress selection", () => {
  const filter = {
    minimumScore: -1,
    maximumScore: 2,
    respectNextSeeingAt: true,
  };

  it("applies score bounds and the next seeing time", () => {
    expect(isStudyProgressEligible({ ...initialStudyProgress("eligible"), score: 2 }, filter, 1_000)).toBe(true);
    expect(isStudyProgressEligible({ ...initialStudyProgress("high"), score: 3 }, filter, 1_000)).toBe(false);
    expect(isStudyProgressEligible({ ...initialStudyProgress("low"), score: -2 }, filter, 1_000)).toBe(false);
    expect(
      isStudyProgressEligible({ ...initialStudyProgress("future"), nextSeeingAt: new Date(1_001) }, filter, 1_000)
    ).toBe(false);
  });

  it("orders progress by seen count", () => {
    const first = { ...initialStudyProgress("first"), numberOfSeen: 1 };
    const second = { ...initialStudyProgress("second"), numberOfSeen: 3 };

    expect([second, first].sort(compareStudyProgress)).toEqual([first, second]);
  });

  it("finds the nearest future seeing time", () => {
    const progresses = [
      { ...initialStudyProgress("past"), nextSeeingAt: new Date(900) },
      { ...initialStudyProgress("later"), nextSeeingAt: new Date(2_000) },
      { ...initialStudyProgress("next"), nextSeeingAt: new Date(1_500) },
    ];

    expect(getNextStudyAvailabilityAt(progresses, 1_000)).toBe(1_500);
  });
});
