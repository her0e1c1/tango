import { describe, expect, it } from "vitest";

import { CONFIG_STORAGE_KEY, createConfigStore, defaultConfig } from "@/features/settings/state/configStore";

const createMemoryStorage = () => {
  const values = new Map<string, string>();
  return {
    getItem: (name: string) => values.get(name) ?? null,
    setItem: (name: string, value: string) => values.set(name, value),
    removeItem: (name: string) => values.delete(name),
  };
};

describe("config store", () => {
  it("updates and toggles long-lived settings", () => {
    const store = createConfigStore({ storage: createMemoryStorage(), skipHydration: true });

    store.getState().updateConfig({ cardInterval: 15, darkMode: true });
    store.getState().toggleConfig("darkMode");

    expect(store.getState().config).toEqual({
      ...defaultConfig,
      cardInterval: 15,
      darkMode: false,
    });
  });

  it("persists only config state and restores it with current defaults", async () => {
    const storage = createMemoryStorage();
    const store = createConfigStore({ storage, skipHydration: true });
    store.getState().updateConfig({ darkMode: true });

    const persisted = JSON.parse(storage.getItem(CONFIG_STORAGE_KEY) ?? "{}");
    expect(persisted).toEqual({
      state: { config: { ...defaultConfig, darkMode: true } },
      version: 1,
    });
    expect(persisted.state).not.toHaveProperty("deck");
    expect(persisted.state).not.toHaveProperty("card");
    expect(persisted.state).not.toHaveProperty("auth");

    const restored = createConfigStore({ storage, skipHydration: true });
    await restored.persist.rehydrate();

    expect(restored.getState().config).toEqual({ ...defaultConfig, darkMode: true });
    expect(restored.getState().updateConfig).toBeTypeOf("function");
    expect(restored.getState().toggleConfig).toBeTypeOf("function");
  });
});
