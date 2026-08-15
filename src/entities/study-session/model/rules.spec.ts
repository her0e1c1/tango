import { describe, expect, it } from "vitest";

import {
  calculateStudySessionIndex,
  groupDecksByStudyStatus,
  isStudySessionPositionUnchanged,
  resolveStudySession,
  resolveStudySessionSwipeEffect,
} from "./rules";
import type { StudySession } from "./types";

const session: StudySession = {
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
};

describe("groupDecksByStudyStatus", () => {
  it("groups studying and not-studying decks in their domain order", () => {
    const decks = [
      { id: "not-studying-z", name: "Zulu" },
      { id: "studying-old", name: "Bravo" },
      { id: "not-studying-a", name: "Alpha" },
      { id: "studying-new", name: "Charlie" },
    ];
    const sessions = {
      "studying-old": { ...session, deckId: "studying-old", lastStudiedAt: 100 },
      "studying-new": { ...session, deckId: "studying-new", lastStudiedAt: 200 },
    };

    const groups = groupDecksByStudyStatus(decks, sessions);

    expect(groups.studying.map(({ deck }) => deck.id)).toEqual(["studying-new", "studying-old"]);
    expect(groups.notStudying.map((deck) => deck.id)).toEqual(["not-studying-a", "not-studying-z"]);
  });

  it("uses deck name as the tie breaker for equally recent sessions", () => {
    const decks = [
      { id: "b", name: "Beta" },
      { id: "a", name: "Alpha" },
    ];
    const sessions = {
      a: { ...session, deckId: "a", lastStudiedAt: 100 },
      b: { ...session, deckId: "b", lastStudiedAt: 100 },
    };

    expect(groupDecksByStudyStatus(decks, sessions).studying.map(({ deck }) => deck.name)).toEqual(["Alpha", "Beta"]);
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
