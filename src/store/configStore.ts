import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export const CONFIG_STORAGE_KEY = "tango-config";

export const defaultConfig: ConfigState = {
  useCardInterval: false,
  showSwipeButtonList: true,
  showScoreSlider: false,
  showHeader: true,
  fullscreen: false,
  maxNumberOfCardsToLearn: 10,
  hideBodyWhenCardChanged: true,
  sizeBackText: 0,
  shuffled: false,
  defaultAutoPlay: false,
  cardInterval: 60,
  keepBackTextViewed: false,
  showSwipeFeedback: false,
  cardSwipeUp: "GoToNextCardMastered",
  cardSwipeDown: "GoToNextCardNotMastered",
  cardSwipeLeft: "GoToPrevCard",
  cardSwipeRight: "GoToNextCard",
  darkMode: false,
  selectedTags: [],
  githubAccessToken: "",
};

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
        merge: (persistedState, currentState) => {
          const persistedConfig = (persistedState as PersistedConfigState | undefined)?.config;
          return {
            ...currentState,
            config: { ...defaultConfig, ...persistedConfig },
          };
        },
      }
    )
  );
};

export const configStore = createConfigStore();
