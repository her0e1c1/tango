import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { defaultPreferences } from "./defaults";
import {
  preferencesStore,
  setDarkMode,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
  updatePreferences,
} from "./store";

/** Synchronous storage contract used by preferences persistence scenarios. */
type MemoryStorage = Omit<StateStorage, "getItem"> & {
  getItem: (name: string) => string | null;
};

// Creates a synchronous in-memory implementation of Zustand storage.
const createMemoryStorage = (initial: Record<string, string> = {}): MemoryStorage => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
};

// Replaces the preferences store's persistence backend with isolated memory storage.
const useMemoryStorage = (initial: Record<string, string> = {}): MemoryStorage => {
  const storage = createMemoryStorage(initial);
  preferencesStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("preferences store", () => {
  beforeEach(() => {
    useMemoryStorage();
    preferencesStore.getState().updatePreferences(defaultPreferences);
  });

  it("updates each preference group without resetting other settings", () => {
    const store = preferencesStore;

    store.getState().updatePreferences({
      loadSample: false,
      appearance: { darkMode: true },
      study: { cardInterval: 15 },
      controls: { showScoreSlider: true },
    });
    store.getState().updatePreferences({ controls: { showSwipeButtonList: false } });
    store.getState().updatePreferences({ controls: { showPlaybackControls: false } });

    expect(store.getState().preferences).toEqual({
      ...defaultPreferences,
      loadSample: false,
      study: { ...defaultPreferences.study, cardInterval: 15 },
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      controls: {
        ...defaultPreferences.controls,
        showScoreSlider: true,
        showSwipeButtonList: false,
        showPlaybackControls: false,
      },
    });
  });

  it("validates numeric ranges during updates", () => {
    const store = preferencesStore;

    store.getState().updatePreferences({
      study: { maxNumberOfCardsToLearn: 101, cardInterval: -1 },
      appearance: { sizeBackText: -1 },
    });

    expect(store.getState().preferences.study.maxNumberOfCardsToLearn).toBe(
      defaultPreferences.study.maxNumberOfCardsToLearn
    );
    expect(store.getState().preferences.study.cardInterval).toBe(defaultPreferences.study.cardInterval);
    expect(store.getState().preferences.appearance.sizeBackText).toBe(defaultPreferences.appearance.sizeBackText);
  });

  it("updates preferences through the public helpers", () => {
    setDarkMode(true);
    updatePreferences({ loadSample: false, study: { cardInterval: 15 } });
    toggleShowSwipeButtonList();
    toggleShowPlaybackControls();

    expect(preferencesStore.getState().preferences).toEqual({
      ...defaultPreferences,
      loadSample: false,
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      study: { ...defaultPreferences.study, cardInterval: 15 },
      controls: { ...defaultPreferences.controls, showSwipeButtonList: false, showPlaybackControls: false },
    });
  });

  it("persists preference changes", () => {
    const storage = useMemoryStorage();

    preferencesStore.getState().updatePreferences({ loadSample: false, appearance: { darkMode: true } });

    expect(JSON.parse(storage.getItem("tango-config") ?? "{}")).toEqual({
      state: {
        preferences: {
          ...defaultPreferences,
          loadSample: false,
          appearance: { ...defaultPreferences.appearance, darkMode: true },
        },
      },
      version: 0,
    });
  });

  it("hydrates persisted preferences", async () => {
    const persistedPreferences = {
      ...defaultPreferences,
      loadSample: false,
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      study: { ...defaultPreferences.study, selectedTags: ["typescript"] },
    };
    useMemoryStorage({
      "tango-config": JSON.stringify({ state: { preferences: persistedPreferences }, version: 0 }),
    });

    await preferencesStore.persist.rehydrate();

    expect(preferencesStore.getState().preferences).toEqual(persistedPreferences);
  });

  it("ignores the retired header preference and defaults playback controls when hydrating older preferences", async () => {
    const { showPlaybackControls: _showPlaybackControls, ...legacyControls } = defaultPreferences.controls;
    useMemoryStorage({
      "tango-config": JSON.stringify({
        state: {
          preferences: {
            ...defaultPreferences,
            appearance: { ...defaultPreferences.appearance, showHeader: false },
            controls: legacyControls,
          },
        },
        version: 0,
      }),
    });

    await preferencesStore.persist.rehydrate();

    const hydratedPreferences = preferencesStore.getState().preferences;
    expect(hydratedPreferences).toEqual(defaultPreferences);
    expect(hydratedPreferences.appearance).not.toHaveProperty("showHeader");
    expect(hydratedPreferences.controls.showPlaybackControls).toBe(true);
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["schema mismatch", JSON.stringify({ state: { preferences: "invalid" }, version: 0 })],
    ["legacy envelope", JSON.stringify({ state: { config: { darkMode: true } }, version: 0 })],
  ])("uses current defaults for %s", async (_case, persistedValue) => {
    useMemoryStorage({ "tango-config": persistedValue });

    await preferencesStore.persist.rehydrate();

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);
  });
});
