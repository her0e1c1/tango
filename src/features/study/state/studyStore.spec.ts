/**
 * @file Verifies the "study store" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps independent study
 * sessions for multiple decks", "updates only the requested session and its last studied time",
 * "touches only an existing requested session".
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { STUDY_STORAGE_KEY, createStudyStore, selectStudySessionForRoute } from "@/features/study/state/studyStore";

/**
 * Provides the create memory storage test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => {
      values.set(name, value);
    },
    removeItem: (name: string) => {
      values.delete(name);
    },
  };
};

/**
 * Provides the create versioned storage test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createVersionedStorage = (state: unknown, version: number) =>
  createMemoryStorage({
    [STUDY_STORAGE_KEY]: JSON.stringify({ state, version }),
  });

/**
 * Provides the call set current index test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const callSetCurrentIndex = (store: ReturnType<typeof createStudyStore>, deckId: DeckId, currentIndex: number) => {
  const setCurrentIndex = store.getState().setCurrentIndex as unknown as (id: DeckId, index: number) => void;
  setCurrentIndex(deckId, currentIndex);
};

/**
 * Provides the call remove study test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const callRemoveStudy = (store: ReturnType<typeof createStudyStore>, deckId: DeckId) => {
  const removeStudy = Reflect.get(store.getState(), "removeStudy");
  expect(removeStudy).toBeTypeOf("function");
  (removeStudy as (id: DeckId) => void)(deckId);
};

describe("study store", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps independent study sessions for multiple decks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().startStudy("deck-1", ["card-1", "card-2"]);
    vi.setSystemTime(2000);
    store.getState().startStudy("deck-2", ["card-3"]);

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 0, lastStudiedAt: 1000 },
      "deck-2": { deckId: "deck-2", cardOrderIds: ["card-3"], currentIndex: 0, lastStudiedAt: 2000 },
    });
  });

  it("updates only the requested session and its last studied time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1", "card-2"]);
    store.getState().startStudy("deck-2", ["card-3", "card-4"]);

    vi.setSystemTime(3000);
    callSetCurrentIndex(store, "deck-1", 1);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 1, lastStudiedAt: 3000 });
    expect(store.getState().sessionsByDeckId["deck-2"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it.each([-1, 2, 0.5])("does not persist an invalid session index: %s", (currentIndex) => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1", "card-2"]);

    vi.setSystemTime(3000);
    callSetCurrentIndex(store, "deck-1", currentIndex);

    expect(store.getState().sessionsByDeckId["deck-1"]).toMatchObject({ currentIndex: 0, lastStudiedAt: 1000 });
  });

  it("touches only an existing requested session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    const touchStudy = Reflect.get(store.getState(), "touchStudy");
    expect(touchStudy).toBeTypeOf("function");

    vi.setSystemTime(4000);
    (touchStudy as (id: DeckId) => void)("deck-1");
    (touchStudy as (id: DeckId) => void)("missing-deck");

    expect(store.getState().sessionsByDeckId["deck-1"]?.lastStudiedAt).toBe(4000);
    expect(store.getState().sessionsByDeckId).not.toHaveProperty("missing-deck");
  });

  it("removes only the requested session", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().startStudy("deck-2", ["card-2"]);

    callRemoveStudy(store, "deck-1");

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-2": expect.objectContaining({ deckId: "deck-2" }),
    });
  });

  it("returns the session for the requested route deck", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().startStudy("deck-2", ["card-2"]);

    expect(selectStudySessionForRoute("deck-1")(store.getState())).toEqual(store.getState().sessionsByDeckId["deck-1"]);
    expect(selectStudySessionForRoute("missing-deck")(store.getState())).toBeNull();
  });

  it("initializes and toggles transient study UI state", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().toggleShowBackText();
    store.getState().setLastSwipe("cardSwipeLeft");

    store.getState().initializeStudyUi(true);
    expect(store.getState()).toMatchObject({ showBackText: false, autoPlay: true, lastSwipe: undefined });

    store.getState().toggleShowBackText();
    store.getState().toggleAutoPlay();
    store.getState().setLastSwipe("cardSwipeRight");
    expect(store.getState()).toMatchObject({ showBackText: true, autoPlay: false, lastSwipe: "cardSwipeRight" });

    store.getState().hideBackText();
    expect(store.getState().showBackText).toBe(false);
  });

  it("persists exactly the session map in a v3 envelope", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const storage = createMemoryStorage();
    const store = createStudyStore({ storage, skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().toggleShowBackText();

    expect(JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
      state: {
        sessionsByDeckId: {
          "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 1000 },
        },
      },
      version: 3,
    });

    const restored = createStudyStore({ storage, skipHydration: true });
    await restored.persist.rehydrate();
    expect(restored.getState()).toMatchObject({
      sessionsByDeckId: {
        "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: 0, lastStudiedAt: 1000 },
      },
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(restored.getState()).not.toHaveProperty("session");
  });

  it("hydrates valid v3 sessions independently and drops unknown metadata", async () => {
    const storage = createVersionedStorage(
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
        showBackText: true,
        unknownRootMetadata: "drop",
      },
      3
    );
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1, lastStudiedAt: 1000 },
    });
    expect(store.getState()).not.toHaveProperty("unknownRootMetadata");
    expect(store.getState().showBackText).toBe(false);
  });

  it.each([1, 2])("migrates a valid v%s session into the v3 map", async (version) => {
    const storage = createVersionedStorage(
      { session: { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1 } },
      version
    );
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({
      "deck-1": { deckId: "deck-1", cardOrderIds: ["card-1", "card-2"], currentIndex: 1, lastStudiedAt: 0 },
    });
    expect(JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
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
    const storage = createVersionedStorage(state, 2);
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().sessionsByDeckId).toEqual({});
  });
});
