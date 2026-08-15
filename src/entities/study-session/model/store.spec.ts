/**
 * @file Verifies the "study store" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps independent study
 * sessions for multiple decks", "updates only the requested session and its last studied time",
 * "touches only an existing requested session".
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStudySessions,
  getStudySession,
  removeStudySession,
  setStudySessionIndex,
  startStudySession,
  studySessionStore,
  touchStudySession,
} from "./store";

const STUDY_STORAGE_KEY = "tango-study";

const setVersionedStorage = (state: unknown, version: number): void => {
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

  it("starts at index zero with a copied card order", () => {
    const cardOrderIds = ["card-1", "card-2"];

    startStudySession("deck-1", cardOrderIds);
    cardOrderIds.pop();

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 0,
    });
  });

  it("keeps independent study sessions for multiple decks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    startStudySession("deck-1", ["card-1", "card-2"]);
    vi.setSystemTime(2000);
    startStudySession("deck-2", ["card-3"]);

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 0, lastStudiedAt: 1000 },
      "deck-2": { deckId: "deck-2", cardOrderIds: ["card-3"], currentIndex: 0, lastStudiedAt: 2000 },
    });
  });

  it("updates only the requested session and its last studied time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startStudySession("deck-1", ["card-1", "card-2"]);
    startStudySession("deck-2", ["card-3", "card-4"]);

    vi.setSystemTime(3000);
    setStudySessionIndex("deck-1", 1);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 1, lastStudiedAt: 3000 });
    expect(store.getState().sessionsByDeckId["deck-2"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it.each([-1, 2, 0.5])("does not persist an invalid session index: %s", (currentIndex) => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startStudySession("deck-1", ["card-1", "card-2"]);

    vi.setSystemTime(3000);
    setStudySessionIndex("deck-1", currentIndex);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it("touches only an existing requested session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startStudySession("deck-1", ["card-1"]);

    vi.setSystemTime(4000);
    touchStudySession("deck-1");
    touchStudySession("missing-deck");

    expect(store.getState().sessionsByDeckId["deck-1"]?.lastStudiedAt).toBe(4000);
    expect(store.getState().sessionsByDeckId).not.toHaveProperty("missing-deck");
  });

  it("removes only the requested session", () => {
    startStudySession("deck-1", ["card-1"]);
    startStudySession("deck-2", ["card-2"]);

    removeStudySession("deck-1");

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-2": expect.objectContaining({ deckId: "deck-2" }),
    });
  });

  it("clears both memory and persisted storage", async () => {
    localStorage.clear();
    startStudySession("deck-1", ["card-1"]);

    expect(getStudySession("deck-1")).toBeDefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).not.toBeNull();

    await clearStudySessions();

    expect(getStudySession("deck-1")).toBeUndefined();
    expect(localStorage.getItem(STUDY_STORAGE_KEY)).toBeNull();
  });

  it("persists exactly the session map in a v3 envelope", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    startStudySession("deck-1", ["card-1"]);

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

  it.each([1, 2])("migrates a valid v%s session into the v3 map", async (version) => {
    setVersionedStorage(
      { session: { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1 } },
      version
    );

    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1, lastStudiedAt: 0 },
    });
    expect(JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
      state: {
        sessionsByDeckId: {
          "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1, lastStudiedAt: 0 },
        },
      },
      version: 3,
    });
  });

  it.each([
    ["a missing session", {}],
    ["an empty card order", { session: { deckId: "deck-1", cardOrderIds: [], currentIndex: 0 } }],
    ["a negative index", { session: { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: -1 } }],
    ["a terminal index", { session: { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: 1 } }],
  ])("drops invalid legacy state with %s", async (_label, state) => {
    setVersionedStorage(state, 2);

    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({});
  });
});
