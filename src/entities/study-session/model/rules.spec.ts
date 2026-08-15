import { describe, expect, it } from "vitest";

import {
  calculateStudySessionIndex,
  isStudySessionPositionUnchanged,
  planStudySessionSwipe,
  resolveStudySession,
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

describe("planStudySessionSwipe", () => {
  const cards = [
    { id: "card-1", score: 0, numberOfSeen: 0 },
    { id: "card-2", score: 2, numberOfSeen: 3 },
  ];

  it("plans the progress edit and session movement for the active card", () => {
    expect(planStudySessionSwipe(session, cards, "GoToNextCardMastered", 1_786_512_000_000)).toEqual({
      effect: "next",
      session,
      progress: {
        cardId: "card-2",
        score: 3,
        numberOfSeen: 4,
        lastSeenAt: 1_786_512_000_000,
      },
    });
  });

  it.each([
    ["GoToPrevCard", "previous"],
    ["GoToNextCard", "next"],
    ["GoToNextCardMastered", "next"],
    ["GoToNextCardNotMastered", "next"],
    ["GoToNextCardToggleMastered", "next"],
  ] as const)("plans %s to move %s after persistence", (swipeAction, effect) => {
    expect(planStudySessionSwipe(session, cards, swipeAction, 0)).toMatchObject({ effect, session });
  });

  it.each([
    ["DoNothing", "none"],
    ["GoBack", "exit"],
  ] as const)("plans %s as %s without a progress edit", (swipeAction, effect) => {
    expect(planStudySessionSwipe(session, cards, swipeAction, 0)).toEqual({ effect });
  });

  it("ignores swipes without a resolvable active session", () => {
    expect(planStudySessionSwipe(undefined, cards, "GoToNextCard", 0)).toEqual({ effect: "none" });
    expect(planStudySessionSwipe(session, cards.slice(0, 1), "GoToNextCard", 0)).toEqual({ effect: "none" });
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
