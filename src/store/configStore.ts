import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";
import { defaultConfig, parsePersistedConfig } from "@/store/configSchema";

export { defaultConfig } from "@/store/configSchema";

export const CONFIG_STORAGE_KEY = "tango-config";

type BooleanConfigKey = {
  [Key in keyof ConfigState]: ConfigState[Key] extends boolean ? Key : never;
}[keyof ConfigState];

export interface ConfigStoreState {
  config: ConfigState;
  updateConfig: (config: Partial<ConfigState>) => void;
  toggleConfig: (key: BooleanConfigKey) => void;
}

type PersistedConfigState = Pick<ConfigStoreState, "config">;

interface CreateConfigStoreOptions {
  storage?: StateStorage;
  skipHydration?: boolean;
}

export const createConfigStore = ({ storage, skipHydration }: CreateConfigStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedConfigState>(() => storage ?? localStorage);
  return createStore<ConfigStoreState>()(
    persist<ConfigStoreState, [], [], PersistedConfigState>(
      (set) => ({
        config: defaultConfig,
        updateConfig: (config) => set((state) => ({ config: { ...state.config, ...config } })),
        toggleConfig: (key) =>
          set((state) => ({ config: { ...state.config, [key]: !state.config[key] } as ConfigState })),
      }),
      {
        name: CONFIG_STORAGE_KEY,
        version: 1,
        storage: persistStorage,
        ...(skipHydration !== undefined ? { skipHydration } : {}),
        partialize: ({ config }) => ({ config }),
        merge: (persistedState, currentState) => ({
          ...currentState,
          config: parsePersistedConfig(persistedState),
        }),
      }
    )
  );
};

export const configStore = createConfigStore();
