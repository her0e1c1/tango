import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { defaultPreferences } from "./defaults";
import { preferencesSchema } from "./schema";
import type { Preferences } from "./types";

/** @internal Partial updates for each top-level preference field. */
export type PartialPreferences = {
  loadSample?: Preferences["loadSample"];
  appearance?: Partial<Preferences["appearance"]>;
  study?: Partial<Preferences["study"]>;
  controls?: Partial<Preferences["controls"]>;
};

/** Live preferences state and its validated update operation. */
interface PreferencesStoreState {
  preferences: Preferences;
  updatePreferences: (preferences: PartialPreferences) => void;
}

/** Browser-persisted subset of preferences state. */
interface PersistedPreferencesState {
  preferences: Preferences;
}

// Creates a persisted preferences store that validates updates and hydrated data.
const createPreferencesStore = () =>
  createStore<PreferencesStoreState>()(
    persist<PreferencesStoreState, [], [["zustand/immer", never]], PersistedPreferencesState>(
      immer((set) => ({
        preferences: defaultPreferences,
        updatePreferences: (preferencesInput) =>
          set((state) => {
            const { selectedTags, ...study } = preferencesInput.study ?? {};
            if (preferencesInput.loadSample !== undefined) state.preferences.loadSample = preferencesInput.loadSample;
            Object.assign(state.preferences.appearance, preferencesInput.appearance);
            Object.assign(state.preferences.study, study);
            Object.assign(state.preferences.controls, preferencesInput.controls);
            if (selectedTags != null) {
              // Do not retain a caller-owned mutable array inside persisted state.
              state.preferences.study.selectedTags = [...selectedTags];
            }
            state.preferences = preferencesSchema.parse(state.preferences);
          }),
      })),
      {
        name: "tango-config",
        merge: (persistedState, currentState) => {
          // Revalidate untrusted storage; the schema recovers fields independently and current defaults remain the fallback.
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

// Applies a partial preferences update through the store's validation boundary.
export const updatePreferences: PreferencesStoreState["updatePreferences"] = (preferences) =>
  preferencesStore.getState().updatePreferences(preferences);

/** @internal Replaces the whole snapshot so deterministic fixtures never inherit earlier store state. */
export const replacePreferences = (input: PartialPreferences): void => {
  const preferences = preferencesSchema.parse(input);
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: {
        ...preferences.study,
        selectedTags: [...preferences.study.selectedTags],
      },
    },
  });
};

// Sets the appearance color mode preference explicitly.
export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });

// Toggles whether study swipe controls are shown.
export const toggleShowSwipeButtonList = (): void => {
  const { showSwipeButtonList } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showSwipeButtonList: !showSwipeButtonList } });
};

// Toggles whether study playback controls are shown.
export const toggleShowPlaybackControls = (): void => {
  const { showPlaybackControls } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showPlaybackControls: !showPlaybackControls } });
};
