import { describe, expect, it } from "vitest";
import { createCard } from "@/test/factories";

import {
  compareStudyProgress,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
  joinCardsWithStudyProgress,
  recordStudyProgress,
} from "./rules";
import type { StudyProgress, StudyRating } from "./types";

const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

describe("joinCardsWithStudyProgress", () => {
  it("returns only Cards with explicitly available StudyProgress", () => {
    const readyCard = createCard({ id: "ready" });
    const loadingCard = createCard({ id: "loading" });
    const progress = initialStudyProgress(readyCard.id);

    expect(joinCardsWithStudyProgress([readyCard, loadingCard], [progress])).toEqual([{ card: readyCard, progress }]);
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
