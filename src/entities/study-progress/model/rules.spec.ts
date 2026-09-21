import { describe, expect, it } from "vitest";

import {
  buildStudyCardOrder,
  calculateDifficulty,
  createStudyProgressFromCard,
  isStudyProgressEligible,
  recordCardStudyProgress,
} from "./rules";
import { createStudyProgress } from "./defaults";
import type { CardProgressFields, StudyProgress, StudyRating } from "./types";

// Builds neutral StudyProgress for eligibility scenarios.
const initialStudyProgress = (cardId: string): StudyProgress => ({ cardId, difficulty: 5, numberOfSeen: 0 });

// Builds the Card fields required by StudyProgress ordering rules.
const cardProgress = (id: string, numberOfSeen = 0): CardProgressFields => ({
  id,
  difficulty: 5,
  numberOfSeen,
});

describe("StudyProgress defaults [CARD-VIEW-01]", () => {
  it("creates unrated progress with neutral difficulty", () => {
    expect(createStudyProgress("card-id")).toEqual({ cardId: "card-id", difficulty: 5, numberOfSeen: 0 });
  });
});

describe("createStudyProgressFromCard [CARD-VIEW-01]", () => {
  it("restores progress from a Card without copying Card content", () => {
    const card = {
      id: "card-id",
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
      frontText: "not part of progress",
    };
    const progress = createStudyProgressFromCard(card);

    expect(progress).toEqual({
      cardId: "card-id",
      difficulty: 3,
      numberOfSeen: 4,
      lastSeenAt: 1_786_512_000_000,
      nextSeeingAt: new Date(1_786_598_400_000),
      interval: 86_400,
    });
    expect(progress).not.toHaveProperty("frontText");
  });
});

describe("recordCardStudyProgress [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it.each<[number, StudyRating | undefined, number]>([
    [5, "good", 4],
    [7, "good", 6],
    [1, "good", 1],
    [5, "again", 6],
    [8, "hard", 7],
    [8, "easy", 7],
    [3, "again", 4],
    [10, "again", 10],
    [3, undefined, 3],
  ])("records difficulty %i for %s as %i", (difficulty, swipeAction, expectedDifficulty) => {
    const card = { ...cardProgress("card-id", 2), difficulty };

    expect(recordCardStudyProgress(card, swipeAction, 1_786_512_000_000)).toEqual({
      cardId: "card-id",
      difficulty: expectedDifficulty,
      numberOfSeen: 3,
      lastSeenAt: 1_786_512_000_000,
    });
  });

  it("does not reset difficulty when the rating direction changes", () => {
    expect(calculateDifficulty(8, "good")).toBe(7);
    expect(calculateDifficulty(3, "again")).toBe(4);
  });
});

describe("calculateDifficulty [STUDY-ACTIONS-01] [STUDY-ACTIONS-02] [STUDY-ACTIONS-03]", () => {
  it.each<[number, StudyRating | undefined, number]>([
    [5, "good", 4],
    [5, "again", 6],
    [5, undefined, 5],
    [5, "hard", 4],
    [5, "easy", 4],
    [1, "good", 1],
    [1, "hard", 1],
    [1, "easy", 1],
    [10, "again", 10],
  ])("adjusts difficulty %i for %s to %i", (difficulty, rating, expectedDifficulty) => {
    expect(calculateDifficulty(difficulty, rating)).toBe(expectedDifficulty);
  });
});

describe("study progress selection [CARD-LIST-ACTIONS-03]", () => {
  const filter = {
    minimumDifficulty: 3,
    maximumDifficulty: 7,
    respectNextSeeingAt: true,
  };

  it("applies difficulty bounds and the next seeing time", () => {
    expect(isStudyProgressEligible({ ...initialStudyProgress("eligible"), difficulty: 7 }, filter, 1000)).toBe(true);
    expect(isStudyProgressEligible({ ...initialStudyProgress("high"), difficulty: 8 }, filter, 1000)).toBe(false);
    expect(isStudyProgressEligible({ ...initialStudyProgress("low"), difficulty: 2 }, filter, 1000)).toBe(false);
    expect(
      isStudyProgressEligible({ ...initialStudyProgress("future"), nextSeeingAt: new Date(1001) }, filter, 1000)
    ).toBe(false);
  });
});

describe("buildStudyCardOrder [STUDY-SESSION-01]", () => {
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
