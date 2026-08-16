import { describe, expect, it } from "vitest";

import type { SwipeAction } from "@/entities/preferences/@x/study-progress";

import {
  buildStudyCardOrder,
  createStudyProgressFromCard,
  isStudyProgressEligible,
  recordCardStudyProgress,
} from "./rules";
import type { CardProgressFields, StudyProgress } from "./types";

// Builds neutral StudyProgress for eligibility scenarios.
const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, score: 0, numberOfSeen: 0 });

// Builds the Card fields required by StudyProgress ordering rules.
const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  score: 0,
  numberOfSeen,
});

describe("createStudyProgressFromCard", () => {
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

describe("recordCardStudyProgress", () => {
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
    const card = { ...cardProgress("card-id", 2), score };

    expect(recordCardStudyProgress(card, swipeAction, 1_786_512_000_000)).toEqual({
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

  it("returns every selected card exactly once when shuffled", () => {
    const result = buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 0 });

    expect(result).toHaveLength(cards.length);
    expect(new Set(result)).toEqual(new Set(["a", "b", "c", "d"]));
  });

  it("limits a shuffled order to distinct selected cards", () => {
    const result = buildStudyCardOrder(cards, { shuffled: true, maxNumberOfCardsToLearn: 2 });

    expect(result).toHaveLength(2);
    expect(new Set(result).size).toBe(2);
    expect(result.every((id) => cards.some((card) => card.id === id))).toBe(true);
  });
});
