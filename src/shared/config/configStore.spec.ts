/**
 * @file Verifies the "config store" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "updates and toggles
 * long-lived settings", "persists only config state and restores it with current defaults", "keeps
 * valid persisted settings and replaces invalid values with current defaults".
 */

import { describe, expect, it } from "vitest";

import { CONFIG_STORAGE_KEY, createConfigStore, defaultConfig } from "@/shared/config/configStore";

/**
 * Provides the create memory storage test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
const createMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
    removeItem: (name: string) => values.delete(name),
  };
};

describe("config store", () => {
  it("updates each preference group without resetting other settings", () => {
    const store = createConfigStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().updateConfig({
      appearance: { darkMode: true },
      study: { cardInterval: 15 },
      controls: { showScoreSlider: true },
    });
    store.getState().updateConfig({ appearance: { showHeader: false } });
    store.getState().toggleConfig("appearance", "darkMode");

    expect(store.getState().config).toEqual({
      ...defaultConfig,
      study: { ...defaultConfig.study, cardInterval: 15 },
      appearance: { ...defaultConfig.appearance, darkMode: false, showHeader: false },
      controls: { ...defaultConfig.controls, showScoreSlider: true },
    });
  });

  it("persists only config state and restores it with current defaults", async () => {
    const storage = createMemoryStorage();
    const store = createConfigStore({ storage, skipHydration: true });
    store.getState().updateConfig({ appearance: { darkMode: true } });

    const persisted = JSON.parse(storage.getItem(CONFIG_STORAGE_KEY) ?? "{}");
    expect(persisted).toEqual({
      state: { config: { ...defaultConfig, appearance: { ...defaultConfig.appearance, darkMode: true } } },
      version: 2,
    });
    expect(persisted.state).not.toHaveProperty("deck");
    expect(persisted.state).not.toHaveProperty("card");
    expect(persisted.state).not.toHaveProperty("auth");

    const restored = createConfigStore({ storage, skipHydration: true });
    await restored.persist.rehydrate();

    expect(restored.getState().config).toEqual({
      ...defaultConfig,
      appearance: { ...defaultConfig.appearance, darkMode: true },
    });

    restored.getState().updateConfig({ appearance: { showHeader: false } });
    restored.getState().toggleConfig("appearance", "darkMode");

    expect(restored.getState().config.appearance).toEqual({
      ...defaultConfig.appearance,
      darkMode: false,
      showHeader: false,
    });
  });

  it("validates numeric ranges during updates", () => {
    const store = createConfigStore({ storage: createMemoryStorage(), skipHydration: true });

    store
      .getState()
      .updateConfig({ study: { maxNumberOfCardsToLearn: 101, cardInterval: -1 }, appearance: { sizeBackText: -1 } });

    expect(store.getState().config.study.maxNumberOfCardsToLearn).toBe(defaultConfig.study.maxNumberOfCardsToLearn);
    expect(store.getState().config.study.cardInterval).toBe(defaultConfig.study.cardInterval);
    expect(store.getState().config.appearance.sizeBackText).toBe(defaultConfig.appearance.sizeBackText);
  });

  it("migrates flat persisted settings without losing valid preferences", async () => {
    const storage = createMemoryStorage({
      [CONFIG_STORAGE_KEY]: JSON.stringify({
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
      }),
    });
    const store = createConfigStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().config).toEqual({
      ...defaultConfig,
      appearance: { ...defaultConfig.appearance, showHeader: false },
      study: { ...defaultConfig.study, cardInterval: 15, selectedTags: ["typescript"] },
      controls: { ...defaultConfig.controls, cardSwipeLeft: "GoBack", showScoreSlider: true },
    });
    expect(store.getState().config.appearance).not.toHaveProperty("removedSetting");
    expect(store.getState().config.appearance).not.toHaveProperty("githubAccessToken");
  });

  it("uses current defaults when persisted config is not an object", async () => {
    const storage = createMemoryStorage({
      [CONFIG_STORAGE_KEY]: JSON.stringify({ state: { config: "invalid" }, version: 1 }),
    });
    const store = createConfigStore({ storage, skipHydration: true });

    await store.persist.rehydrate();

    expect(store.getState().config).toEqual(defaultConfig);
  });
});
