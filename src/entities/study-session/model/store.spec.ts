/**
 * @file Exercises the singleton store with its real persistence middleware.
 * Memory and localStorage are reset together because leaking either layer would
 * make hydration and mutation results depend on test order.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStudySessions,
  getStudySession,
  moveStudySession,
  removeStudySession,
  setStudySessionIndex,
  startStudy,
  studySessionStore,
  touchStudySession,
} from "./store";

const STUDY_STORAGE_KEY = "tango-study";

const startSession = (deckId: string, cardOrderIds: string[]): void => {
  startStudy(
    deckId,
    cardOrderIds.map((id, numberOfSeen) => ({ id, score: 0, numberOfSeen })),
    { shuffled: false, maxNumberOfCardsToLearn: 0 }
  );
};

const setVersionedStorage = (state: unknown, version: number): void => {
  // Bypass store mutations so hydration tests model arbitrary browser payloads.
  localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify({ state, version }));
};

describe("study store", () => {
  const store = studySessionStore;

  beforeEach(() => {
    store.setState({ sessionsByDeckId: {} });
    localStorage.clear();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await clearStudySessions();
  });

  it("starts at index zero with the configured card order", () => {
    startSession("deck-1", ["card-1", "card-2"]);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 0,
    });
  });

  it("keeps independent study sessions for multiple decks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    startSession("deck-1", ["card-1", "card-2"]);
    vi.setSystemTime(2000);
    startSession("deck-2", ["card-3"]);

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 0, lastStudiedAt: 1000 },
      "deck-2": { deckId: "deck-2", cardOrderIds: ["card-3"], currentIndex: 0, lastStudiedAt: 2000 },
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

    moveStudySession("deck-1", "next");
    expect(getStudySession("deck-1")?.currentIndex).toBe(1);

    moveStudySession("deck-1", "next");
    expect(getStudySession("deck-1")).toBeUndefined();
  });

  it.each([-1, 2, 0.5])("does not persist an invalid session index: %s", (currentIndex) => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1", "card-2"]);

    vi.setSystemTime(3000);
    setStudySessionIndex("deck-1", currentIndex);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
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

  it("clears both memory and persisted storage", async () => {
    localStorage.clear();
    startSession("deck-1", ["card-1"]);

    expect(getStudySession("deck-1")).toBeDefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).not.toBeNull();

    await clearStudySessions();

    expect(getStudySession("deck-1")).toBeUndefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("rejects when persisted storage cleanup fails", async () => {
    const failure = new Error("storage cleanup failed");
    vi.spyOn(store.persist, "clearStorage").mockImplementationOnce(() => {
      throw failure;
    });

    await expect(clearStudySessions()).rejects.toBe(failure);
  });

  it("persists exactly the session map in a v3 envelope", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startSession("deck-1", ["card-1"]);

    const persistedSession = localStorage.getItem(STUDY_STORAGE_KEY);
    expect(JSON.parse(persistedSession ?? "{}")).toEqual({
      state: {
        sessionsByDeckId: {
          "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 1000 },
        },
      },
      version: 3,
    });

    store.setState({ sessionsByDeckId: {} });
    if (persistedSession != null) localStorage.setItem(STUDY_STORAGE_KEY, persistedSession);
    await store.persist.rehydrate();
    expect(store.getState()).toMatchObject({
      sessionsByDeckId: {
        "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 1000 },
      },
    });
    expect(store.getState()).not.toHaveProperty("session");
  });

  it("hydrates valid v3 sessions independently and drops unknown metadata", async () => {
    setVersionedStorage(
      {
        sessionsByDeckId: {
          "deck-1": {
            deckId: "deck-1",
            cardOrderIds: ["card-1", "card-2"],
            currentIndex: 1,
            lastStudiedAt: 1000,
            unknownSessionMetadata: "drop",
          },
          broken: { deckId: "broken", cardOrderIds: [], currentIndex: 0, lastStudiedAt: 2000 },
        },
        unknownRootMetadata: "drop",
      },
      3
    );
    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1, lastStudiedAt: 1000 },
    });
    expect(store.getState()).not.toHaveProperty("unknownRootMetadata");
  });
});
