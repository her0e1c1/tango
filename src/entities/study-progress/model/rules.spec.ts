import { describe, expect, it, vi } from "vitest";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import {
  buildStudyCardOrder,
  createStudyProgressFromCard,
  getNextStudyAvailabilityAt,
  isStudyProgressEligible,
  recordStudyProgress,
  resolveStudyRating,
} from "./rules";
import type { CardProgressFields, StudyProgress, StudyProgressEdit, StudyRating } from "./types";

const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  score: 0,
  numberOfSeen,
});

describe("resolveStudyRating", () => {
  it.each<[SwipeAction, StudyRating]>([
    ["GoToNextCardMastered", "mastered"],
    ["GoToNextCardNotMastered", "not-mastered"],
    ["GoToNextCardToggleMastered", "not-mastered"],
    ["DoNothing", "unrated"],
    ["GoBack", "unrated"],
    ["GoToPrevCard", "unrated"],
    ["GoToNextCard", "unrated"],
  ])("maps %s to %s", (action, expectedRating) => {
    expect(resolveStudyRating(action)).toBe(expectedRating);
  });
});

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
    expect(isStudyProgressEligible({ ...initialStudyProgress("eligible"), score: 2 }, filter, 1000)).toBe(true);
    expect(isStudyProgressEligible({ ...initialStudyProgress("high"), score: 3 }, filter, 1000)).toBe(false);
    expect(isStudyProgressEligible({ ...initialStudyProgress("low"), score: -2 }, filter, 1000)).toBe(false);
    expect(
      isStudyProgressEligible({ ...initialStudyProgress("future"), nextSeeingAt: new Date(1001) }, filter, 1000)
    ).toBe(false);
  });

  it("finds the nearest future seeing time", () => {
    const progresses = [
      { ...initialStudyProgress("past"), nextSeeingAt: new Date(900) },
      { ...initialStudyProgress("later"), nextSeeingAt: new Date(2000) },
      { ...initialStudyProgress("next"), nextSeeingAt: new Date(1500) },
    ];

    expect(getNextStudyAvailabilityAt(progresses, 1000)).toBe(1500);
  });
});

describe("buildStudyCardOrder", () => {
  const cards = [cardProgress("a"), cardProgress("b"), cardProgress("c"), cardProgress("d")];

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
    const unorderedCards = [cardProgress("seen", 5), cardProgress("new", 1), cardProgress("middle", 3)];

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
