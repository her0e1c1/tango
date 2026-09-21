/**
 * @file Exercises visible session state and preserves the legacy browser backup.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearStudySessions } from "./actions/clearStudySessions";
import { getStudySession } from "./queries/getStudySession";
import { moveStudySession } from "./actions/moveStudySession";
import { removeStudySession } from "./actions/removeStudySession";
import { setStudySessionIndex } from "./actions/setStudySessionIndex";
import { startStudy } from "@/test/entityFixtures";
import { studySessionStore } from "./store";
import { touchStudySession } from "./actions/touchStudySession";

const STUDY_STORAGE_KEY = "tango-study";

// Starts a deterministic study session from the supplied Card order.
const startSession = (deckId: string, cardOrderIds: string[]): void => {
  startStudy(
    deckId,
    cardOrderIds.map((id, numberOfSeen) => ({ id, difficulty: 5, numberOfSeen })),
    { shuffled: false, maxNumberOfCardsToLearn: 0 },
    "uid"
  );
};

describe("study store [STUDY-SESSION-01] [STUDY-ACTIONS-04]", () => {
  const store = studySessionStore;

  beforeEach(() => {
    store.setState({ sessionsByDeckId: {} });
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    clearStudySessions();
    vi.unstubAllGlobals();
  });

  it("keeps independent study sessions for multiple decks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    startSession("deck-1", ["card-1", "card-2"]);
    vi.setSystemTime(2000);
    startSession("deck-2", ["card-3"]);

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": {
        sessionId: expect.any(String),
        deckId: "deck-1",
        cardOrderIds: ["card-1", "card-2"],
        currentIndex: 0,
        lastStudiedAt: 1000,
        remote: { uid: "uid", startedAt: 1000 },
      },
      "deck-2": {
        sessionId: expect.any(String),
        deckId: "deck-2",
        cardOrderIds: ["card-3"],
        currentIndex: 0,
        lastStudiedAt: 2000,
        remote: { uid: "uid", startedAt: 2000 },
      },
    });
  });

  it("updates only the requested session and its last studied time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1", "card-2"]);
    startSession("deck-2", ["card-3", "card-4"]);

    vi.setSystemTime(3000);
    setStudySessionIndex("deck-1", 1);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 1, lastStudiedAt: 3000 });
    expect(store.getState().sessionsByDeckId["deck-2"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it("moves within a session and removes it when movement reaches an edge", () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const firstCard = getStudySession("deck-1");
    if (firstCard == null) throw new Error("Expected an active study session");

    expect(moveStudySession(firstCard)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);

    const finalCard = getStudySession("deck-1");
    if (finalCard == null) throw new Error("Expected an active study session");
    expect(moveStudySession(finalCard)).toBe(true);
    expect(getStudySession("deck-1")).toBeUndefined();
  });

  it("moves only when the persisted swipe still owns the active card", () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const previous = getStudySession("deck-1");
    if (previous == null) throw new Error("Expected an active study session");

    touchStudySession("deck-1");
    expect(moveStudySession(previous)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);

    expect(moveStudySession(previous)).toBe(false);
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);
  });

  it("does not move a replacement session that starts on the same card", () => {
    startSession("deck-1", ["card-1", "card-2"]);
    const previous = getStudySession("deck-1");
    if (previous == null) throw new Error("Expected an active study session");

    startSession("deck-1", ["card-1", "card-2"]);
    const replacement = getStudySession("deck-1");

    expect(replacement?.sessionId).not.toBe(previous.sessionId);
    expect(moveStudySession(previous)).toBe(false);
    expect(getStudySession("deck-1")?.currentIndex).toBe(0);
  });

  it.each([-1, 2, 0.5])("does not persist an invalid session index: %s", (currentIndex) => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1", "card-2"]);

    vi.setSystemTime(3000);
    setStudySessionIndex("deck-1", currentIndex);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it("keeps the current Card and persisted resume point when asked to move backward", () => {
    startSession("deck-1", ["card-1", "card-2", "card-3"]);
    setStudySessionIndex("deck-1", 1);
    const session = getStudySession("deck-1");
    const persisted = localStorage.getItem(STUDY_STORAGE_KEY);

    expect(setStudySessionIndex("deck-1", 0)).toBe(false);
    expect(getStudySession("deck-1")).toEqual(session);
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe(persisted);
    expect(setStudySessionIndex("deck-1", 2)).toBe(true);
    expect(getStudySession("deck-1")?.currentIndex).toBe(2);
  });

  it("touches only an existing requested session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1"]);

    vi.setSystemTime(4000);
    touchStudySession("deck-1");
    touchStudySession("missing-deck");

    expect(store.getState().sessionsByDeckId["deck-1"]?.lastStudiedAt).toBe(4000);
    expect(store.getState().sessionsByDeckId).not.toHaveProperty("missing-deck");
  });

  it("removes only the requested session", () => {
    startSession("deck-1", ["card-1"]);
    startSession("deck-2", ["card-2"]);

    removeStudySession("deck-1");

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-2": expect.objectContaining({ deckId: "deck-2" }),
    });
  });

  it("clears the visible session without deleting the legacy backup", () => {
    localStorage.setItem(STUDY_STORAGE_KEY, "legacy backup");
    startSession("deck-1", ["card-1"]);
    clearStudySessions();
    expect(getStudySession("deck-1")).toBeUndefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBe("legacy backup");
  });
});

vi.mock("@/shared/firebase", () => ({ db: {} }));
