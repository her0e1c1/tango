import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import { createCard, createStudyProgress } from "@/test/factories";
import {
  buildStudyCardOrder,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
  joinCardsWithStudyProgress,
  recordStudyProgress,
} from "./rules";
import type { StudyProgress, StudyRating } from "./types";

const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

const studyCard = (id: string, numberOfSeen = 0) => {
  const card = createCard({ id });
  return { card, progress: createStudyProgress({ cardId: card.id, numberOfSeen }) };
};

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

  it("finds the nearest future seeing time", () => {
    const progresses = [
      { ...initialStudyProgress("past"), nextSeeingAt: new Date(900) },
      { ...initialStudyProgress("later"), nextSeeingAt: new Date(2_000) },
      { ...initialStudyProgress("next"), nextSeeingAt: new Date(1_500) },
    ];

    expect(getNextStudyAvailabilityAt(progresses, 1_000)).toBe(1_500);
  });
});

describe("buildStudyCardOrder", () => {
  const cards = [studyCard("a"), studyCard("b"), studyCard("c"), studyCard("d")];

  it("returns the progress-based card order when shuffle and maximum are disabled", () => {
    expect(buildStudyCardOrder(cards, { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual(["a", "b", "c", "d"]);
  });

  it("returns no card IDs for an empty selection", () => {
    expect(buildStudyCardOrder([], { shuffled: false, maxNumberOfCardsToLearn: 0 })).toEqual([]);
  });

  it("limits the number of cards", () => {
    expect(buildStudyCardOrder(cards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual(["a", "b"]);
  });

  it("orders cards by study progress before applying the maximum", () => {
    const unorderedCards = [studyCard("seen", 5), studyCard("new", 1), studyCard("middle", 3)];

    expect(buildStudyCardOrder(unorderedCards, { shuffled: false, maxNumberOfCardsToLearn: 2 })).toEqual([
      "new",
      "middle",
    ]);
  });

  it("shuffles before applying the maximum", () => {
    expect(buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 2 })).toEqual(["d", "c"]);
    expect(mocks.shuffle).toHaveBeenCalledWith(["a", "b", "c", "d"]);
  });
});
