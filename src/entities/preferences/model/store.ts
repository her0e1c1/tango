import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

import { defaultPreferences, type Preferences } from "./preferences";
import { preferencesSchema } from "./schema";

type PartialPreferences = {
  [K in keyof Preferences]?: Partial<Preferences[K]>;
};

interface PreferencesStoreState {
  preferences: Preferences;
  updatePreferences: (preferences: PartialPreferences) => void;
}

interface PersistedPreferencesState {
  preferences: Preferences;
}

interface CreatePreferencesStoreOptions {
  storage?: StateStorage;
}

const createInitialPreferences = (): Preferences => ({
  ...defaultPreferences,
  appearance: { ...defaultPreferences.appearance },
  study: { ...defaultPreferences.study, selectedTags: [...defaultPreferences.study.selectedTags] },
  controls: { ...defaultPreferences.controls },
});

const getPersistedPreferences = (persistedState: unknown): Preferences => {
  if (typeof persistedState !== "object" || persistedState == null || !("preferences" in persistedState)) {
    return createInitialPreferences();
  }
  return preferencesSchema.parse(persistedState.preferences);
};

const createPreferencesStore = ({ storage }: CreatePreferencesStoreOptions = {}) => {
  const persistStorage = createJSONStorage<PersistedPreferencesState>(() => storage ?? localStorage);
  return createStore<PreferencesStoreState>()(
    persist<PreferencesStoreState, [], [], PersistedPreferencesState>(
      (set) => ({
        preferences: createInitialPreferences(),
        updatePreferences: (preferencesInput) =>
          set((state) => {
            const merged = {
              appearance: { ...state.preferences.appearance, ...preferencesInput.appearance },
              study: {
                ...state.preferences.study,
                ...preferencesInput.study,
                selectedTags:
                  preferencesInput.study?.selectedTags == null
                    ? state.preferences.study.selectedTags
                    : [...preferencesInput.study.selectedTags],
              },
              controls: { ...state.preferences.controls, ...preferencesInput.controls },
            };
            return { preferences: preferencesSchema.parse(merged) };
          }),
      }),
      {
        name: "tango-config",
        ...(persistStorage !== undefined ? { storage: persistStorage } : {}),
        merge: (persistedState, currentState) => ({
          ...currentState,
          preferences: getPersistedPreferences(persistedState),
        }),
        partialize: ({ preferences }) => ({ preferences }),
      }
    )
  );
};

export const preferencesStore = createPreferencesStore();

export const updatePreferences: PreferencesStoreState["updatePreferences"] = (preferences) =>
  preferencesStore.getState().updatePreferences(preferences);

export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });

export const toggleShowHeader = (): void => {
  const { showHeader } = preferencesStore.getState().preferences.appearance;
  updatePreferences({ appearance: { showHeader: !showHeader } });
};

export const toggleShowSwipeButtonList = (): void => {
  const { showSwipeButtonList } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showSwipeButtonList: !showSwipeButtonList } });
};
