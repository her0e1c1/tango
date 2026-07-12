import { expect, it, describe } from "vitest";
import {
  resolveSwipeAction,
  calculateCardScore,
  buildStudyPatch,
  calculateNextIndex,
  buildStudySession,
  calculateGoToIndex,
  filterCardsForDeck,
} from "@src/lib/study";

describe("resolveSwipeAction", () => {
  it("returns the swipe action for the given direction", () => {
    const config = {
      cardSwipeLeft: "GoBack",
      cardSwipeRight: "GoToNextCardMastered",
      cardSwipeUp: "GoToNextCardNotMastered",
      cardSwipeDown: "DoNothing",
    } as ConfigState;
    expect(resolveSwipeAction(config, "cardSwipeRight")).toBe("GoToNextCardMastered");
    expect(resolveSwipeAction(config, "cardSwipeLeft")).toBe("GoBack");
    expect(resolveSwipeAction(config, "cardSwipeUp")).toBe("GoToNextCardNotMastered");
    expect(resolveSwipeAction(config, "cardSwipeDown")).toBe("DoNothing");
  });
});

describe("calculateCardScore", () => {
  it("increments score for GoToNextCardMastered when score is non-negative", () => {
    expect(calculateCardScore({ score: 0 } as Card, "GoToNextCardMastered")).toBe(1);
    expect(calculateCardScore({ score: 3 } as Card, "GoToNextCardMastered")).toBe(4);
  });

  it("resets to 0 for GoToNextCardMastered when score is negative", () => {
    expect(calculateCardScore({ score: -1 } as Card, "GoToNextCardMastered")).toBe(0);
  });

  it("decrements score for GoToNextCardNotMastered when score is non-positive", () => {
    expect(calculateCardScore({ score: 0 } as Card, "GoToNextCardNotMastered")).toBe(-1);
    expect(calculateCardScore({ score: -2 } as Card, "GoToNextCardNotMastered")).toBe(-3);
  });

  it("resets to 0 for GoToNextCardNotMastered when score is positive", () => {
    expect(calculateCardScore({ score: 2 } as Card, "GoToNextCardNotMastered")).toBe(0);
  });

  it("applies same logic as NotMastered for GoToNextCardToggleMastered", () => {
    expect(calculateCardScore({ score: 0 } as Card, "GoToNextCardToggleMastered")).toBe(-1);
    expect(calculateCardScore({ score: 2 } as Card, "GoToNextCardToggleMastered")).toBe(0);
  });

  it("leaves score unchanged for navigation-only actions", () => {
    expect(calculateCardScore({ score: 3 } as Card, "GoToNextCard")).toBe(3);
    expect(calculateCardScore({ score: 3 } as Card, "GoToPrevCard")).toBe(3);
    expect(calculateCardScore({ score: 3 } as Card, "GoBack")).toBe(3);
    expect(calculateCardScore({ score: 3 } as Card, "DoNothing")).toBe(3);
  });
});

describe("buildStudyPatch", () => {
  const now = new Date(1999, 10, 1).getTime();
  const card = { id: "c1", deckId: "d1", score: 0, numberOfSeen: 2 } as Card;

  it("builds a patch with incremented numberOfSeen and computed score", () => {
    const patch = buildStudyPatch(card, "GoToNextCardMastered", now);
    expect(patch).toEqual({
      id: "c1",
      deckId: "d1",
      score: 1,
      numberOfSeen: 3,
      lastSeenAt: now,
    });
  });

  it("preserves score for navigation-only actions", () => {
    const patch = buildStudyPatch(card, "GoToNextCard", now);
    expect(patch.score).toBe(0);
    expect(patch.numberOfSeen).toBe(3);
  });
});

describe("calculateNextIndex", () => {
  it("moves forward for non-prev actions", () => {
    expect(calculateNextIndex(0, 3, "GoToNextCard")).toBe(1);
    expect(calculateNextIndex(1, 3, "GoToNextCardMastered")).toBe(2);
  });

  it("returns -1 when advancing past the last card", () => {
    expect(calculateNextIndex(2, 3, "GoToNextCard")).toBe(-1);
  });

  it("moves backward for GoToPrevCard", () => {
    expect(calculateNextIndex(2, 3, "GoToPrevCard")).toBe(1);
  });

  it("returns -1 when moving before the first card", () => {
    expect(calculateNextIndex(0, 3, "GoToPrevCard")).toBe(-1);
  });
});

describe("buildStudySession", () => {
  const cards = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }] as Card[];

  it("returns all card IDs in order when not shuffled and no max", () => {
    const config = { shuffled: false, maxNumberOfCardsToLearn: 0 } as ConfigState;
    expect(buildStudySession(cards, config)).toEqual(["a", "b", "c", "d"]);
  });

  it("respects maxNumberOfCardsToLearn", () => {
    const config = { shuffled: false, maxNumberOfCardsToLearn: 2 } as ConfigState;
    expect(buildStudySession(cards, config)).toEqual(["a", "b"]);
  });

  it("returns shuffled IDs when shuffled is true", () => {
    const config = { shuffled: true, maxNumberOfCardsToLearn: 0 } as ConfigState;
    const result = buildStudySession(cards, config);
    expect(result).toHaveLength(4);
    expect(result.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("applies max limit after shuffle", () => {
    const config = { shuffled: true, maxNumberOfCardsToLearn: 2 } as ConfigState;
    const result = buildStudySession(cards, config);
    expect(result).toHaveLength(2);
  });
});

describe("calculateGoToIndex", () => {
  const deck = { cardOrderIds: ["a", "b", "c"] } as Deck;

  it("returns the correct index for a known cardId", () => {
    expect(calculateGoToIndex("b", deck)).toBe(1);
    expect(calculateGoToIndex("c", deck)).toBe(2);
  });

  it("returns 0 when cardId is not found", () => {
    expect(calculateGoToIndex("z", deck)).toBe(0);
  });
});

describe("filterCardsForDeck", () => {
  const makeCard = (overrides: Partial<Card>): Card =>
    ({
      id: "c1",
      score: 0,
      numberOfSeen: 0,
      tags: [],
      nextSeeingAt: undefined,
      ...overrides,
    }) as Card;

  const baseDeck = {
    selectedTags: [],
    tagAndFilter: false,
    scoreMax: null,
    scoreMin: null,
  } as unknown as Deck;

  const baseConfig = { useCardInterval: false } as ConfigState;

  it("returns all cards when no filters active", () => {
    const cards = [makeCard({ id: "a" }), makeCard({ id: "b" })];
    expect(filterCardsForDeck(cards, baseDeck, baseConfig)).toHaveLength(2);
  });

  it("filters by tag (OR mode)", () => {
    const cards = [makeCard({ id: "a", tags: ["x"] }), makeCard({ id: "b", tags: ["y"] })];
    const deck = { ...baseDeck, selectedTags: ["x"], tagAndFilter: false };
    expect(filterCardsForDeck(cards, deck, baseConfig).map((c) => c.id)).toEqual(["a"]);
  });

  it("filters by tag (AND mode)", () => {
    const cards = [makeCard({ id: "a", tags: ["x", "y"] }), makeCard({ id: "b", tags: ["x"] })];
    const deck = { ...baseDeck, selectedTags: ["x", "y"], tagAndFilter: true };
    expect(filterCardsForDeck(cards, deck, baseConfig).map((c) => c.id)).toEqual(["a"]);
  });

  it("filters by scoreMax", () => {
    const cards = [makeCard({ id: "a", score: 3 }), makeCard({ id: "b", score: 1 })];
    const deck = { ...baseDeck, scoreMax: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig).map((c) => c.id)).toEqual(["b"]);
  });

  it("filters by scoreMin", () => {
    const cards = [makeCard({ id: "a", score: 1 }), makeCard({ id: "b", score: 3 })];
    const deck = { ...baseDeck, scoreMin: 2 };
    expect(filterCardsForDeck(cards, deck, baseConfig).map((c) => c.id)).toEqual(["b"]);
  });

  it("filters by card interval when useCardInterval is true", () => {
    const future = new Date(Date.now() + 100_000);
    const cards = [makeCard({ id: "a", nextSeeingAt: future }), makeCard({ id: "b" })];
    const config = { useCardInterval: true } as ConfigState;
    expect(filterCardsForDeck(cards, baseDeck, config).map((c) => c.id)).toEqual(["b"]);
  });

  it("sorts by numberOfSeen ascending", () => {
    const cards = [makeCard({ id: "a", numberOfSeen: 5 }), makeCard({ id: "b", numberOfSeen: 1 })];
    const result = filterCardsForDeck(cards, baseDeck, baseConfig);
    expect(result.map((c) => c.id)).toEqual(["b", "a"]);
  });
});
