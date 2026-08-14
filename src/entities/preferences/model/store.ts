import { persist } from "zustand/middleware";
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

const createPreferencesStore = () =>
  createStore<PreferencesStoreState>()(
    persist<PreferencesStoreState, [], [], PersistedPreferencesState>(
      (set) => ({
        preferences: defaultPreferences,
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
        merge: (persistedState, currentState) => {
          const result = preferencesSchema.safeParse(
            (persistedState as Partial<PersistedPreferencesState> | undefined)?.preferences
          );
          return result.success ? { ...currentState, preferences: result.data } : currentState;
        },
        partialize: ({ preferences }) => ({ preferences }),
      }
    )
  );

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
