/**
 * @file Defines application configuration behavior for Config Store.
 * It validates persisted settings and exposes a predictable store interface to the rest of the
 * application.
 */

import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import type { ConfigState } from "./config";
import { configSchema, defaultConfig, parsePersistedConfig } from "./configSchema";

export { defaultConfig } from "./configSchema";

export const CONFIG_STORAGE_KEY = "tango-config";
const CONFIG_STORAGE_VERSION = 2;

type BooleanConfigKey = {
  [Key in keyof ConfigState]: ConfigState[Key] extends boolean ? Key : never;
}[keyof ConfigState];

export interface ConfigStoreState {
  config: ConfigState;
  updateConfig: (config: Partial<ConfigState>) => void;
  toggleConfig: (key: BooleanConfigKey) => void;
}

interface PersistedConfigState {
  config: ConfigState;
}

interface CreateConfigStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

/**
 * Creates a configuration store that validates and persists user settings.
 * Optional storage and hydration controls let tests run without the browser's local storage.
 */
export const createConfigStore = ({ storage, skipHydration }: CreateConfigStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedConfigState>(() => storage ?? localStorage);
  return createStore<ConfigStoreState>()(
    persist<ConfigStoreState, [], [], PersistedConfigState>(
      (set) => ({
        config: { ...defaultConfig, selectedTags: [...defaultConfig.selectedTags] },
        updateConfig: (config) =>
          set((state) => ({
            config: configSchema.parse({
              ...state.config,
              ...config,
              selectedTags: config.selectedTags == null ? state.config.selectedTags : [...config.selectedTags],
            }),
          })),
        toggleConfig: (key) =>
          set((state) => ({ config: { ...state.config, [key]: !state.config[key] } as ConfigState })),
      }),
      {
        name: CONFIG_STORAGE_KEY,
        version: CONFIG_STORAGE_VERSION,
        storage: persistStorage,
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        migrate: (persistedState) => ({ config: parsePersistedConfig(persistedState) }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          config: parsePersistedConfig(persistedState),
        }),
      }
    )
  );
};

export const configStore = createConfigStore();
