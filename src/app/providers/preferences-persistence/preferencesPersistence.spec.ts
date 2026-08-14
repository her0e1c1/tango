import { beforeEach, describe, expect, it } from "vitest";

import { defaultPreferences, preferencesStore } from "@/entities/preferences";

import { startPreferencesPersistence } from "./preferencesPersistence";

const PREFERENCES_STORAGE_KEY = "tango-config";
const PREFERENCES_STORAGE_VERSION = 3;

const createMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
  };
};

describe("preferences persistence", () => {
  beforeEach(() => {
    preferencesStore.getState().updatePreferences(defaultPreferences);
  });

  it("hydrates the store and persists subsequent changes", () => {
    const storage = createMemoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({
        state: {
          preferences: {
            ...defaultPreferences,
            appearance: { ...defaultPreferences.appearance, darkMode: true },
          },
        },
        version: PREFERENCES_STORAGE_VERSION,
      }),
    });
    const stop = startPreferencesPersistence(storage, preferencesStore);

    expect(preferencesStore.getState().preferences.appearance.darkMode).toBe(true);

    preferencesStore.getState().updatePreferences({ appearance: { showHeader: false } });
    expect(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}")).toEqual({
      state: {
        preferences: {
          ...defaultPreferences,
          appearance: { ...defaultPreferences.appearance, darkMode: true, showHeader: false },
        },
      },
      version: PREFERENCES_STORAGE_VERSION,
    });

    stop();
  });

  it("migrates the previous persisted config envelope and flat settings", () => {
    const persisted = {
      state: {
        config: {
          cardInterval: 15,
          cardSwipeLeft: "GoBack",
          darkMode: "yes",
          selectedTags: ["typescript"],
          showHeader: false,
          showScoreSlider: true,
          removedSetting: true,
          githubAccessToken: "legacy-secret",
        },
      },
      version: 2,
    };

    const storage = createMemoryStorage({ [PREFERENCES_STORAGE_KEY]: JSON.stringify(persisted) });
    const stop = startPreferencesPersistence(storage, preferencesStore);

    expect(preferencesStore.getState().preferences).toEqual({
      ...defaultPreferences,
      appearance: { ...defaultPreferences.appearance, showHeader: false },
      study: { ...defaultPreferences.study, cardInterval: 15, selectedTags: ["typescript"] },
      controls: { ...defaultPreferences.controls, cardSwipeLeft: "GoBack", showScoreSlider: true },
    });

    stop();
  });

  it("uses current defaults for invalid persisted data", () => {
    preferencesStore.getState().updatePreferences({ appearance: { darkMode: true } });
    const storage = createMemoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({ state: { config: "invalid" }, version: 1 }),
    });

    const stop = startPreferencesPersistence(storage, preferencesStore);

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);
    stop();
  });
});
