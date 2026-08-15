import { describe, expect, it } from "vitest";

import {
  calculateStudySessionIndex,
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
      status: "ready",
      session,
      card: cards[1],
    });
  });

  it("waits while cards for an active session are still loading", () => {
    expect(resolveStudySession(session, [])).toEqual({ status: "loading" });
  });

  it("reports unavailable when the session or its active card is missing", () => {
    expect(resolveStudySession(undefined, cards)).toEqual({ status: "unavailable" });
    expect(resolveStudySession(session, cards.slice(0, 1))).toEqual({ status: "unavailable" });
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
