import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { defaultPreferences } from "./defaults";
import { preferencesSchema } from "./schema";
import type { Preferences } from "./types";

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
    persist<PreferencesStoreState, [], [["zustand/immer", never]], PersistedPreferencesState>(
      immer((set) => ({
        preferences: defaultPreferences,
        updatePreferences: (preferencesInput) =>
          set((state) => {
            const { selectedTags, ...study } = preferencesInput.study ?? {};
            Object.assign(state.preferences.appearance, preferencesInput.appearance);
            Object.assign(state.preferences.study, study);
            Object.assign(state.preferences.controls, preferencesInput.controls);
            if (selectedTags != null) {
              state.preferences.study.selectedTags = [...selectedTags];
            }
            state.preferences = preferencesSchema.parse(state.preferences);
          }),
      })),
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
