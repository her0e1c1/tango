import { describe, expect, it } from "vitest";

import {
  calculateStudySessionIndex,
  canMoveStudySession,
  compareActiveDecks,
  groupDecksByStudyStatus,
  isStudySessionPositionUnchanged,
  planStudySessionSwipe,
} from "./rules";
import type { StudySession } from "./types";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
};

describe("compareActiveDecks", () => {
  it("orders recent sessions first and uses deck name as the tie breaker", () => {
    const activeDecks = [
      { deck: { name: "Bravo" }, session: { ...session, lastStudiedAt: 100 } },
      { deck: { name: "Charlie" }, session: { ...session, lastStudiedAt: 200 } },
      { deck: { name: "Alpha" }, session: { ...session, lastStudiedAt: 200 } },
    ];

    expect(activeDecks.sort(compareActiveDecks).map(({ deck }) => deck.name)).toEqual(["Alpha", "Charlie", "Bravo"]);
  });
});

describe("groupDecksByStudyStatus", () => {
  it("groups decks by whether they have a study session", () => {
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

    expect(groups.active.map(({ deck }) => deck.id)).toEqual(["studying-old", "studying-new"]);
    expect(groups.inactive.map((deck) => deck.id)).toEqual(["not-studying-z", "not-studying-a"]);
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

describe("canMoveStudySession", () => {
  it("reports whether movement stays inside the Card order", () => {
    expect(canMoveStudySession(session, "previous")).toBe(true);
    expect(canMoveStudySession(session, "next")).toBe(true);
    expect(canMoveStudySession({ ...session, currentIndex: 0 }, "previous")).toBe(false);
    expect(canMoveStudySession({ ...session, currentIndex: 2 }, "next")).toBe(false);
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
    expect(planStudySessionSwipe({ ...session, currentIndex: 3 }, cards, "GoToNextCard", 0)).toEqual({
      effect: "none",
    });
  });
});

describe("isStudySessionPositionUnchanged", () => {
  it("ignores timestamp-only changes", () => {
    expect(isStudySessionPositionUnchanged(session, { ...session, lastStudiedAt: 1 })).toBe(true);
  });

  it("detects a replaced session, changed index, active card, or removed session", () => {
    expect(isStudySessionPositionUnchanged(session, { ...session, sessionId: "session-2" })).toBe(false);
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
