/**
 * @file Exercises visible session state and preserves the legacy browser backup.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearStudySessions } from "./actions/clearStudySessions";
import { getStudySession } from "./queries/getStudySession";
import { removeStudySession } from "./actions/removeStudySession";
import { startStudy } from "@/test/entityFixtures";
import { studySessionStore } from "./store";

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
