import { describe, expect, it } from "vitest";

import { STUDY_STORAGE_KEY, createStudyStore, selectStudySessionForRoute } from "@/features/study/state/studyStore";

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

const createVersionedStorage = (state: unknown, version: number) =>
  createMemoryStorage({
    [STUDY_STORAGE_KEY]: JSON.stringify({ state, version }),
  });

const createV1Storage = (state: unknown) => createVersionedStorage(state, 1);
const createV2Storage = (state: unknown) => createVersionedStorage(state, 2);

const malformedPersistedStates: Array<[string, unknown]> = [
  ["a null root", null],
  ["an array root", []],
  ["a missing session", {}],
  ["an array session", { session: [] }],
  ["a non-string deck id", { session: { deckId: 1, cardOrderIds: ["card-1"], currentIndex: 0 } }],
  ["a non-array card order", { session: { deckId: "deck-1", cardOrderIds: "card-1", currentIndex: 0 } }],
  ["a non-string card id", { session: { deckId: "deck-1", cardOrderIds: ["card-1", 2], currentIndex: 0 } }],
  ["a non-number index", { session: { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: "0" } }],
  ["a non-finite index", { session: { deckId: "deck-1", cardOrderIds: ["card-1"], currentIndex: null } }],
];

describe("study store", () => {
  it("starts a study session atomically at index zero", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().startStudy("deck-1", ["card-1", "card-2"]);

    expect(store.getState().session).toEqual({
      deckId: "deck-1",
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 0,
    });
  });

  it("updates only the active session index", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1", "card-2"]);

    store.getState().setCurrentIndex(1);

    expect(store.getState().session).toEqual({
      deckId: "deck-1",
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 1,
    });
  });

  it("does not create a session when setting an index without one", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().setCurrentIndex(1);

    expect(store.getState().session).toBeNull();
  });

  it("resets the session", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);

    store.getState().resetStudy();

    expect(store.getState().session).toBeNull();
  });

  it("returns a session only for its route deck", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);

    expect(selectStudySessionForRoute("deck-1")(store.getState())).toEqual(store.getState().session);
    expect(selectStudySessionForRoute("deck-2")(store.getState())).toBeNull();
  });

  it("initializes transient UI state for a new study", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().toggleShowBackText();
    store.getState().setLastSwipe("cardSwipeLeft");

    store.getState().initializeStudyUi(true);

    expect(store.getState()).toMatchObject({
      showBackText: false,
      autoPlay: true,
      lastSwipe: undefined,
    });
  });

  it("toggles transient study UI state", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().toggleShowBackText();
    store.getState().toggleAutoPlay();
    store.getState().setLastSwipe("cardSwipeRight");
    expect(store.getState()).toMatchObject({
      showBackText: true,
      autoPlay: true,
      lastSwipe: "cardSwipeRight",
    });

    store.getState().hideBackText();
    expect(store.getState().showBackText).toBe(false);
  });

  it("writes exactly the session in a v2 persistence envelope", async () => {
    const storage = createMemoryStorage();
    const store = createStudyStore({ storage, skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().toggleShowBackText();
    store.getState().toggleAutoPlay();
    store.getState().setLastSwipe("cardSwipeLeft");

    expect(JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
      state: {
        session: {
          deckId: "deck-1",
          cardOrderIds: ["card-1"],
          currentIndex: 0,
        },
      },
      version: 2,
    });

    const restored = createStudyStore({ storage, skipHydration: true });
    await restored.persist.rehydrate();

    expect(restored.getState()).toMatchObject({
      session: {
        deckId: "deck-1",
        cardOrderIds: ["card-1"],
        currentIndex: 0,
      },
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(restored.getState()).not.toHaveProperty("legacyMigratedDeckIds");
  });

  it("hydrates only a valid current v2 session while retaining transient state and methods", async () => {
    const session = {
      deckId: "deck-1",
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 1.5,
    };
    const storage = createV2Storage({
      session: { ...session, unknownSessionMetadata: "drop" },
      showBackText: true,
      autoPlay: true,
      lastSwipe: "cardSwipeLeft",
      resetStudy: "broken",
      unknownRootMetadata: "drop",
    });
    const store = createStudyStore({ storage, skipHydration: true });
    const resetStudy = store.getState().resetStudy;

    await store.persist.rehydrate();

    expect(store.getState()).toMatchObject({
      session,
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
    expect(store.getState().resetStudy).toBe(resetStudy);
    expect(store.getState()).not.toHaveProperty("unknownRootMetadata");
    expect(store.getState().session).not.toHaveProperty("unknownSessionMetadata");
  });

  it.each(malformedPersistedStates)("sanitizes current v2 state with %s", async (_label, state) => {
    const storage = createV2Storage(state);
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().session).toBeNull();
  });

  it("sanitizes a non-finite numeric current v2 index", async () => {
    const storage = createMemoryStorage({
      [STUDY_STORAGE_KEY]:
        '{"state":{"session":{"deckId":"deck-1","cardOrderIds":["card-1"],"currentIndex":1e400}},"version":2}',
    });
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().session).toBeNull();
  });

  it.each([
    ["a negative index", -1],
    ["a terminal index", 2],
  ])("migrates a valid v1 session with %s and drops legacy markers", async (_label, currentIndex) => {
    const session = {
      deckId: "deck-1",
      cardOrderIds: ["card-1", "card-2"],
      currentIndex,
    };
    const storage = createV1Storage({
      session,
      legacyMigratedDeckIds: { "deck-1": true },
      unknownMetadata: "drop",
    });
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().session).toEqual(session);
    expect(store.getState()).not.toHaveProperty("legacyMigratedDeckIds");
    expect(JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
      state: { session },
      version: 2,
    });
  });

  it.each([
    ...malformedPersistedStates,
    ["a null session", { session: null }],
  ])("falls back to a null session when v1 contains %s", async (_label, state) => {
    const storage = createV1Storage(state);
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().session).toBeNull();
    expect(JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}")).toEqual({
      state: { session: null },
      version: 2,
    });
  });

  it("rejects a non-finite numeric v1 index", async () => {
    const storage = createMemoryStorage({
      [STUDY_STORAGE_KEY]:
        '{"state":{"session":{"deckId":"deck-1","cardOrderIds":["card-1"],"currentIndex":1e400}},"version":1}',
    });
    const store = createStudyStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().session).toBeNull();
  });
});
