/**
 * @file Exercises visible session state and preserves the legacy browser backup.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearStudySessions } from "./actions/clearStudySessions";
import { getStudySession } from "./queries/getStudySession";
import { replaceRemoteStudySessions } from "./actions/replaceRemoteStudySessions";
import { startStudy, restoreStudySession } from "@/test/entityFixtures";
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

  it("[UNIT-STORE-STUDY-02] removes sessions absent from the latest snapshot while retaining other progress", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1"]);
    vi.setSystemTime(2000);
    startSession("deck-2", ["card-2", "card-3"]);
    const second = getStudySession("deck-2");
    if (!second) throw new Error("Missing second session");
    restoreStudySession({ ...second, currentIndex: 1 });
    const retained = getStudySession("deck-2");
    if (!retained) throw new Error("Missing retained session");

    replaceRemoteStudySessions([retained]);

    expect(getStudySession("deck-1")).toBeUndefined();
    expect(getStudySession("deck-2")).toEqual(retained);
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
