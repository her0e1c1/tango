/**
 * @file Defines application configuration behavior for Config Store.
 * It validates persisted settings and exposes a predictable store interface to the rest of the
 * application.
 */

import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { configSchema, defaultConfig, normalizeConfigInput, parsePersistedConfig } from "@/shared/config/configSchema";

export { defaultConfig } from "@/shared/config/configSchema";

export const CONFIG_STORAGE_KEY = "tango-config";
const CONFIG_STORAGE_VERSION = 2;

type ConfigSection = keyof ConfigState;

type BooleanConfigKey<S extends ConfigSection> = {
  [Key in keyof ConfigState[S]]: ConfigState[S][Key] extends boolean ? Key : never;
}[keyof ConfigState[S]];

export type PartialConfigState = {
  [K in keyof ConfigState]?: Partial<ConfigState[K]>;
};

export interface ConfigStoreState {
  config: ConfigState;
  updateConfig: (config: PartialConfigState) => void;
  toggleConfig: <S extends ConfigSection>(section: S, key: BooleanConfigKey<S>) => void;
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
        config: {
          ...defaultConfig,
          study: { ...defaultConfig.study, selectedTags: [...defaultConfig.study.selectedTags] },
        },
        updateConfig: (configInput) =>
          set((state) => {
            const raw = normalizeConfigInput(configInput) as PartialConfigState;
            const merged = {
              appearance: { ...state.config.appearance, ...raw.appearance },
              study: {
                ...state.config.study,
                ...raw.study,
                selectedTags:
                  raw.study?.selectedTags == null ? state.config.study.selectedTags : [...raw.study.selectedTags],
              },
              controls: { ...state.config.controls, ...raw.controls },
            };
            return { config: configSchema.parse(merged) };
          }),
        toggleConfig: (section, key) =>
          set((state) => ({
            config: {
              ...state.config,
              [section]: {
                ...state.config[section],
                [key]: !state.config[section][key],
              },
            },
          })),
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
