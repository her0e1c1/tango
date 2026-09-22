import { calculateFsrsState } from "@/test/studyStateFixtures";
import { describe, expect, it, vi } from "vitest";
import { createCard, createDeck } from "@/test/factories";

import {
  calculateStudySessionIndex,
  canMoveStudySession,
  isStudySessionPositionUnchanged,
  resolveStudySession,
  selectStudyCardsWithDeadline,
} from "./rules";
import type { StudySession } from "./types";

const session: StudySession = {
  sessionId: "session-1",
  deckId: "deck-1",
  cardOrderIds: ["card-1", "card-2", "card-3"],
  currentIndex: 1,
  lastStudiedAt: 0,
  remote: { uid: "uid", startedAt: 0 },
};

describe("study card selection [STUDY-SESSION-01]", () => {
  const deck = createDeck({ selectedTags: ["selected"], tagAndFilter: false });
  const due = calculateFsrsState(null, "good", 0);
  const card = { ...createCard({ id: "due", tags: ["selected"] }), fsrs: due };
  it.each([true, false])("applies tags and deadlines with interval=%s", (useInterval) => {
    const cards = [
      card,
      { ...card, id: "new", fsrs: null },
      { ...card, id: "other-tag", tags: ["other"] },
      { ...card, id: "future", fsrs: { ...due, dueAt: due.dueAt + 1 } },
    ];
    const selected = selectStudyCardsWithDeadline(cards, deck, useInterval, due.dueAt);
    expect(selected.cards.map(({ id }) => id)).toEqual(useInterval ? ["due", "new"] : ["due", "new", "future"]);
    expect(selected.nextDueAt).toBe(useInterval ? due.dueAt + 1 : undefined);
  });
  it("rejects malformed FSRS state instead of classifying it as new", () => {
    expect(() =>
      selectStudyCardsWithDeadline([{ ...card, fsrs: { ...due, reps: 0 } }], deck, true, due.dueAt)
    ).toThrow();
  });
});

describe("calculateStudySessionIndex [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it("moves within the session card order", () => {
    expect(calculateStudySessionIndex(session)).toBe(2);
  });

  it("returns no index when movement completes the session", () => {
    expect(calculateStudySessionIndex({ ...session, currentIndex: 2 })).toBeUndefined();
  });
});

describe("canMoveStudySession [STUDY-ACTIONS-03] [STUDY-ACTIONS-04]", () => {
  it("reports whether movement stays inside the Card order", () => {
    expect(canMoveStudySession(session)).toBe(true);
    expect(canMoveStudySession({ ...session, currentIndex: 2 })).toBe(false);
  });
});

describe("resolveStudySession [STUDY-ACTIONS-03]", () => {
  const cards = [{ id: "card-1", frontText: "front" }];

  it("resolves the Card at the active session position", () => {
    const activeSession = { ...session, currentIndex: 0 };

    expect(resolveStudySession(activeSession, cards)).toEqual({
      status: "studying",
      session: activeSession,
      card: cards[0],
    });
  });

  it("waits while Cards have not loaded", () => {
    expect(resolveStudySession(session, [])).toEqual({ status: "preparing" });
  });

  it("rejects a missing session, empty position, or absent loaded Card", () => {
    expect(resolveStudySession(undefined, cards)).toEqual({ status: "invalid" });
    expect(resolveStudySession({ ...session, cardOrderIds: [] }, [])).toEqual({ status: "invalid" });
    expect(resolveStudySession(session, cards)).toEqual({ status: "invalid" });
  });
});

describe("isStudySessionPositionUnchanged [STUDY-ACTIONS-05]", () => {
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

vi.mock("@/shared/firebase", () => ({ db: {} }));
