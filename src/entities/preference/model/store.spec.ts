import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import {
  preferencesStore,
  setDarkMode,
  toggleShowCardDetails,
  toggleShowEditLink,
  toggleShowHelp,
  toggleShowPlaybackControls,
  toggleShowSkip,
  toggleShowSwipeButtonList,
  toggleViewMode,
  updatePreferences,
} from "./store";

const defaultPreferences = preferencesStore.getInitialState().preferences;

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

describe("preferences store [STUDY-CONTROLS-09] [SETTINGS-06] [NAVIGATION-14]", () => {
  beforeEach(() => {
    useMemoryStorage();
    updatePreferences(defaultPreferences);
  });

  it("persists view mode without changing other preferences", async () => {
    const before = preferencesStore.getState().preferences;
    toggleViewMode();
    await preferencesStore.persist.rehydrate();
    expect(preferencesStore.getState().preferences).toEqual({
      ...before,
      controls: { ...before.controls, viewMode: true },
    });
    toggleViewMode();
    await preferencesStore.persist.rehydrate();
    expect(preferencesStore.getState().preferences).toEqual(before);
  });

  it("persists hiding and restoring the view edit link", async () => {
    expect(preferencesStore.getState().preferences.controls.showEditLink).toBe(true);
    toggleShowEditLink();
    await preferencesStore.persist.rehydrate();
    expect(preferencesStore.getState().preferences.controls.showEditLink).toBe(false);
    toggleShowEditLink();
    expect(preferencesStore.getState().preferences.controls.showEditLink).toBe(true);
  });

  it("shows the study skip control by default", () => {
    expect(defaultPreferences.controls.showSkip).toBe(true);
  });

  it("keeps back text swipe overlays off by default", () => {
    expect(defaultPreferences.controls.showBackTextSwipeOverlays).toBe(false);
  });

  it("shows the study Help shortcut by default", () => {
    expect(defaultPreferences.controls.showHelp).toBe(true);
  });

  it("updates each preference group without resetting other settings", () => {
    const store = preferencesStore;

    updatePreferences({
      loadSample: false,
      appearance: { darkMode: true },
      study: { cardInterval: 15 },
      controls: { showCardDetails: false, showBackTextSwipeOverlays: true },
    });
    updatePreferences({ controls: { showSwipeButtonList: false } });
    updatePreferences({ controls: { showPlaybackControls: false } });
    updatePreferences({ controls: { showSkip: false } });

    expect(store.getState().preferences).toEqual({
      ...defaultPreferences,
      loadSample: false,
      study: { ...defaultPreferences.study, cardInterval: 15 },
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      controls: {
        ...defaultPreferences.controls,
        showCardDetails: false,
        showBackTextSwipeOverlays: true,
        showSwipeButtonList: false,
        showPlaybackControls: false,
        showSkip: false,
      },
    });
  });

  it.each(["system", "en", "ja"] as const)(
    "updates and persists the %s language without resetting other preferences",
    (language) => {
      const storage = useMemoryStorage();
      updatePreferences({ appearance: { darkMode: true } });

      updatePreferences({ language });

      const expectedPreferences = {
        ...defaultPreferences,
        language,
        appearance: { ...defaultPreferences.appearance, darkMode: true },
      };
      expect(preferencesStore.getState().preferences).toEqual(expectedPreferences);
      expect(JSON.parse(storage.getItem("tango-config") ?? "{}")).toEqual({
        state: { preferences: expectedPreferences },
        version: 1,
      });
    }
  );

  it("validates numeric ranges during updates", () => {
    const store = preferencesStore;

    updatePreferences({
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
    toggleShowCardDetails();
    toggleShowHelp();
    toggleShowSkip();

    expect(preferencesStore.getState().preferences).toEqual({
      ...defaultPreferences,
      loadSample: false,
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      study: { ...defaultPreferences.study, cardInterval: 15 },
      controls: {
        ...defaultPreferences.controls,
        showSwipeButtonList: false,
        showPlaybackControls: false,
        showCardDetails: false,
        showHelp: false,
        showSkip: false,
      },
    });
  });

  it("persists preference changes", () => {
    const storage = useMemoryStorage();

    updatePreferences({
      loadSample: false,
      appearance: { darkMode: true },
      controls: { showCardDetails: false, showBackTextSwipeOverlays: true },
    });

    expect(JSON.parse(storage.getItem("tango-config") ?? "{}")).toEqual({
      state: {
        preferences: {
          ...defaultPreferences,
          loadSample: false,
          appearance: { ...defaultPreferences.appearance, darkMode: true },
          controls: {
            ...defaultPreferences.controls,
            showCardDetails: false,
            showBackTextSwipeOverlays: true,
          },
        },
      },
      version: 1,
    });
  });

  it("hydrates version 1 preferences with defaults for additive fields", async () => {
    const {
      language: _language,
      controls: {
        viewMode: _viewMode,
        showHelp: _showHelp,
        showEditLink: _showEditLink,
        showBackTextSwipeOverlays: _showBackTextSwipeOverlays,
        showSkip: _showSkip,
        ...controlsBeforeAdditiveFields
      },
      ...preferencesBeforeAdditiveFields
    } = defaultPreferences;
    const persistedPreferences = {
      ...preferencesBeforeAdditiveFields,
      loadSample: false,
      appearance: { ...defaultPreferences.appearance, darkMode: true },
      study: { ...defaultPreferences.study, selectedTags: ["typescript"] },
      controls: { ...controlsBeforeAdditiveFields, showSwipeButtonList: false },
    };
    useMemoryStorage({
      "tango-config": JSON.stringify({ state: { preferences: persistedPreferences }, version: 1 }),
    });

    await preferencesStore.persist.rehydrate();

    expect(preferencesStore.getState().preferences).toEqual({
      ...persistedPreferences,
      language: "system",
      controls: {
        ...persistedPreferences.controls,
        viewMode: false,
        showHelp: true,
        showEditLink: true,
        showBackTextSwipeOverlays: false,
        showSkip: true,
      },
    });
  });

  it.each([
    { up: "GoToNextCardMastered", expectedUp: "RateEasy", expectedRight: "RateGood" },
    { up: "GoBack", expectedUp: "GoBack", expectedRight: "GoToNextCard" },
    { up: "RateHard", expectedUp: "RateHard", expectedRight: "GoToNextCard" },
  ])(
    "hydrates the version-1 mapping with up=$up without resetting other preferences",
    async ({ up, expectedUp, expectedRight }) => {
      const persisted = {
        ...defaultPreferences,
        language: "ja",
        appearance: { ...defaultPreferences.appearance, darkMode: true },
        study: { ...defaultPreferences.study, cardInterval: 15 },
        controls: {
          ...defaultPreferences.controls,
          showSwipeButtonList: false,
          cardSwipeUp: up,
          cardSwipeDown: "GoToNextCardNotMastered",
          cardSwipeLeft: "GoToPrevCard",
          cardSwipeRight: "GoToNextCard",
        },
      };
      useMemoryStorage({ "tango-config": JSON.stringify({ state: { preferences: persisted }, version: 1 }) });
      await preferencesStore.persist.rehydrate();
      expect(preferencesStore.getState().preferences).toEqual({
        ...persisted,
        controls: {
          ...persisted.controls,
          cardSwipeUp: expectedUp,
          cardSwipeDown: "RateHard",
          cardSwipeLeft: "RateAgain",
          cardSwipeRight: expectedRight,
        },
      });
    }
  );

  it("discards version 2 preferences without migration", async () => {
    useMemoryStorage({
      "tango-config": JSON.stringify({
        state: {
          preferences: {
            ...defaultPreferences,
            loadSample: false,
            appearance: { ...defaultPreferences.appearance, darkMode: true },
            study: { ...defaultPreferences.study, cardInterval: 15, selectedTags: ["legacy"] },
            controls: { ...defaultPreferences.controls, showSwipeButtonList: false },
          },
        },
        version: 2,
      }),
    });

    // A rejected version is expected to be reported by Zustand; keep intentional invalidation quiet in test output.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    try {
      await preferencesStore.persist.rehydrate();
    } finally {
      consoleError.mockRestore();
    }

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["schema mismatch", JSON.stringify({ state: { preferences: "invalid" }, version: 1 })],
    ["incompatible envelope", JSON.stringify({ state: { config: { darkMode: true } }, version: 1 })],
  ])("uses current defaults for %s", async (_case, persistedValue) => {
    useMemoryStorage({ "tango-config": persistedValue });

    await preferencesStore.persist.rehydrate();

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);
  });
});
