import type { Card } from "@/entities/card";
import type { SwipeState } from "@/shared/config";

import { describe, expect, it } from "vitest";

import { buildStudyPatch, calculateCardScore, resolveSwipeAction } from "@/features/study/model/swipe";

describe("resolveSwipeAction", () => {
  it("returns the swipe action for the given direction", () => {
    const controls = {
      cardSwipeLeft: "GoBack",
      cardSwipeRight: "GoToNextCardMastered",
      cardSwipeUp: "GoToNextCardNotMastered",
      cardSwipeDown: "DoNothing",
    } as SwipeState;
    expect(resolveSwipeAction(controls, "cardSwipeRight")).toBe("GoToNextCardMastered");
    expect(resolveSwipeAction(controls, "cardSwipeLeft")).toBe("GoBack");
    expect(resolveSwipeAction(controls, "cardSwipeUp")).toBe("GoToNextCardNotMastered");
    expect(resolveSwipeAction(controls, "cardSwipeDown")).toBe("DoNothing");
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
