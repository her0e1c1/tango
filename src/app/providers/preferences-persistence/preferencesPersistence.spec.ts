import { beforeEach, describe, expect, it } from "vitest";

import { defaultPreferences, preferencesStore } from "@/entities/preferences";

import { startPreferencesPersistence } from "./preferencesPersistence";

const PREFERENCES_STORAGE_KEY = "tango-config";

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
    const persistedPreferences = {
      ...defaultPreferences,
      appearance: { ...defaultPreferences.appearance, darkMode: true },
    };
    const storage = createMemoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify(persistedPreferences),
    });
    const stop = startPreferencesPersistence(storage);

    expect(preferencesStore.getState().preferences.appearance.darkMode).toBe(true);

    preferencesStore.getState().updatePreferences({ appearance: { showHeader: false } });
    expect(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY) ?? "{}")).toEqual({
      ...defaultPreferences,
      appearance: { ...defaultPreferences.appearance, darkMode: true, showHeader: false },
    });

    stop();
  });

  it("does not restore legacy persistence envelopes", () => {
    const storage = createMemoryStorage({
      [PREFERENCES_STORAGE_KEY]: JSON.stringify({
        state: {
          preferences: {
            ...defaultPreferences,
            appearance: { ...defaultPreferences.appearance, darkMode: true },
          },
        },
        version: 3,
      }),
    });
    const stop = startPreferencesPersistence(storage);

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);

    stop();
  });

  it("keeps current defaults for malformed persisted data", () => {
    preferencesStore.getState().updatePreferences({ appearance: { darkMode: true } });
    const storage = createMemoryStorage({ [PREFERENCES_STORAGE_KEY]: "invalid json" });

    const stop = startPreferencesPersistence(storage);

    expect(preferencesStore.getState().preferences).toEqual(defaultPreferences);
    stop();
  });
});
