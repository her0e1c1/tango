import { describe, expect, it } from "vitest";

import {
  STUDY_STORAGE_KEY,
  createStudyStore,
  selectStudySessionForRoute,
} from "@src/features/study/state/studyStore";

const createMemoryStorage = () => {
  const values = new Map<string, string>();
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

  it("resets the session without clearing migrated deck markers", () => {
    const store = createStudyStore({ storage: createMemoryStorage(), skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().markLegacyMigrated("deck-1");

    store.getState().resetStudy();

    expect(store.getState().session).toBeNull();
    expect(store.getState().legacyMigratedDeckIds).toEqual({ "deck-1": true });
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

  it("persists only the session and legacy migration markers", async () => {
    const storage = createMemoryStorage();
    const store = createStudyStore({ storage, skipHydration: true });
    store.getState().startStudy("deck-1", ["card-1"]);
    store.getState().markLegacyMigrated("deck-1");
    store.getState().toggleShowBackText();
    store.getState().toggleAutoPlay();
    store.getState().setLastSwipe("cardSwipeLeft");

    const persisted = JSON.parse(storage.getItem(STUDY_STORAGE_KEY) ?? "{}");
    expect(persisted).toEqual({
      state: {
        session: {
          deckId: "deck-1",
          cardOrderIds: ["card-1"],
          currentIndex: 0,
        },
        legacyMigratedDeckIds: { "deck-1": true },
      },
      version: 1,
    });

    const restored = createStudyStore({ storage, skipHydration: true });
    await restored.persist.rehydrate();

    expect(restored.getState()).toMatchObject({
      session: {
        deckId: "deck-1",
        cardOrderIds: ["card-1"],
        currentIndex: 0,
      },
      legacyMigratedDeckIds: { "deck-1": true },
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });
});
