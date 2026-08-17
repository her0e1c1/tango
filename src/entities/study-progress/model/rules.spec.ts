import { describe, expect, it } from "vitest";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import { buildStudyCardOrder, isStudyProgressEligible, recordStudyProgress } from "./rules";
import type { StudyProgress } from "./types";

// Builds neutral StudyProgress for eligibility scenarios.
const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

// Builds progress with the requested interaction count for ordering rules.
const studyProgress = (cardId: string, numberOfSeen = 0): StudyProgress => ({
  cardId,
  score: 0,
  numberOfSeen,
});

describe("recordStudyProgress", () => {
  it.each<[number, SwipeAction, number]>([
    [0, "GoToNextCardMastered", 1],
    [3, "GoToNextCardMastered", 4],
    [-1, "GoToNextCardMastered", 0],
    [0, "GoToNextCardNotMastered", -1],
    [-2, "GoToNextCardToggleMastered", -3],
    [2, "GoToNextCardNotMastered", 0],
    [3, "GoToNextCard", 3],
    [3, "GoToPrevCard", 3],
  ])("records score %i for %s as %i", (score, swipeAction, expectedScore) => {
    const progress = { ...studyProgress("card-id", 2), score };

    expect(recordStudyProgress(progress, swipeAction, 1_786_512_000_000)).toEqual({
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
    expect(isStudyProgressEligible({ ...initialStudyProgress("eligible"), score: 2 }, filter, 1000)).toBe(true);
    expect(isStudyProgressEligible({ ...initialStudyProgress("high"), score: 3 }, filter, 1000)).toBe(false);
    expect(isStudyProgressEligible({ ...initialStudyProgress("low"), score: -2 }, filter, 1000)).toBe(false);
    expect(
      isStudyProgressEligible({ ...initialStudyProgress("future"), nextSeeingAt: new Date(1001) }, filter, 1000)
    ).toBe(false);
  });
});

describe("buildStudyCardOrder", () => {
  const progresses = [studyProgress("a"), studyProgress("b"), studyProgress("c"), studyProgress("d")];

  it("returns the progress-based card order when shuffle and maximum are disabled", () => {
    expect(buildStudyCardOrder(progresses, { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("returns no card IDs for an empty selection", () => {
    expect(buildStudyCardOrder([], { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([]);
  });

  it("limits the number of cards", () => {
    expect(buildStudyCardOrder(progresses, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual(["a", "b"]);
  });

  it("orders cards by study progress before applying the maximum", () => {
    const unorderedProgresses = [studyProgress("seen", 5), studyProgress("new", 1), studyProgress("middle", 3)];

    expect(buildStudyCardOrder(unorderedProgresses, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual([
      "new",
      "middle",
    ]);
  });

  it("returns every selected card exactly once when shuffled", () => {
    const result = buildStudyCardOrder(progresses, { shuffled: true, maxNumberOfCardsToLearn: 0 });

    expect(result).toHaveLength(progresses.length);
    expect(new Set(result)).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("limits a shuffled order to distinct selected cards", () => {
    const result = buildStudyCardOrder(progresses, { shuffled: true, maxNumberOfCardsToLearn: 2 });

    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result.every((id) => progresses.some((progress) => progress.cardId === id))).toBe(true);
  });
});
