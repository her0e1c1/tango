import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ shuffle: vi.fn((ids: string[]) => [...ids].reverse()) }));

vi.mock("lodash", () => ({ shuffle: mocks.shuffle }));

import {
  buildStudyCardOrder,
  calculateStudySessionIndex,
  isStudySessionPositionUnchanged,
  resolveStudySession,
  resolveStudySessionSwipeEffect,
} from "./rules";
import type { StudySession } from "./types";

const studyCard = (id: string, numberOfSeen = 0) => ({ id, numberOfSeen });

const session: StudySession = {
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
};

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

describe("calculateStudySessionIndex", () => {
  it("moves within the session card order", () => {
    expect(calculateStudySessionIndex(session, "previous")).toBe(0);
    expect(calculateStudySessionIndex(session, "next")).toBe(2);
  });

  it("returns no index when movement completes the session", () => {
    expect(calculateStudySessionIndex({ ...session, currentIndex: 0 }, "previous")).toBeUndefined();
    expect(calculateStudySessionIndex({ ...session, currentIndex: 2 }, "next")).toBeUndefined();
  });
});

describe("resolveStudySession", () => {
  const cards = [
    { id: "card-1", label: "one" },
    { id: "card-2", label: "two" },
  ];

  it("resolves the card at the persisted session position", () => {
    expect(resolveStudySession(session, cards)).toEqual({
      status: "studying",
      session,
      card: cards[1],
    });
  });

  it("waits while cards for an active session are being prepared", () => {
    expect(resolveStudySession(session, [])).toEqual({ status: "preparing" });
  });

  it("reports invalid when the session or its active card is missing", () => {
    expect(resolveStudySession(undefined, cards)).toEqual({ status: "invalid" });
    expect(resolveStudySession(session, cards.slice(0, 1))).toEqual({ status: "invalid" });
  });
});

describe("resolveStudySessionSwipeEffect", () => {
  it.each([
    ["DoNothing", "none"],
    ["GoBack", "exit"],
    ["GoToPrevCard", "previous"],
    ["GoToNextCard", "next"],
    ["GoToNextCardMastered", "next"],
    ["GoToNextCardNotMastered", "next"],
    ["GoToNextCardToggleMastered", "next"],
  ] as const)("maps %s to the %s session effect", (swipeAction, effect) => {
    expect(resolveStudySessionSwipeEffect(swipeAction)).toBe(effect);
  });
});

describe("isStudySessionPositionUnchanged", () => {
  it("ignores timestamp-only changes", () => {
    expect(isStudySessionPositionUnchanged(session, { ...session, lastStudiedAt: 1 })).toBe(true);
  });

  it("detects a changed index, active card, or removed session", () => {
    expect(isStudySessionPositionUnchanged(session, { ...session, currentIndex: 2 })).toBe(false);
    expect(
      isStudySessionPositionUnchanged(session, {
        ...session,
        cardOrderIds: ["card-1", "card-3", "card-2"],
      })
    ).toBe(false);
    expect(isStudySessionPositionUnchanged(session, undefined)).toBe(false);
  });
});
