import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { persistedPreferencesSchema, preferencesSchema } from "./schema";
import type { PartialPreferences, Preferences } from "./types";

const PREFERENCES_STORAGE_KEY = "tango-config";
// Keep this stable for safely defaultable additions; a dedicated task must justify invalidating existing preferences.
const PREFERENCES_STORAGE_VERSION = 1;

const defaultPreferences: Preferences = preferencesSchema.parse({});
// Store creation and recovery share these defaults, so freeze every mutable branch to prevent cross-reset mutation.
Object.freeze(defaultPreferences.study.selectedTags);
Object.freeze(defaultPreferences.appearance);
Object.freeze(defaultPreferences.study);
Object.freeze(defaultPreferences.controls);
Object.freeze(defaultPreferences);

/** Live validated preferences state. */
interface PreferencesStoreState {
  preferences: Preferences;
}

export const preferencesStore = createStore<PreferencesStoreState>()(
  persist(
    immer(() => ({ preferences: defaultPreferences })),
    {
      name: PREFERENCES_STORAGE_KEY,
      version: PREFERENCES_STORAGE_VERSION,
      merge: (persistedState, currentState) => {
        // Version-mismatched state is rejected before merge; validate only current-version state before replacing defaults.
        const result = persistedPreferencesSchema.safeParse(
          (persistedState as Partial<PreferencesStoreState> | undefined)?.preferences
        );
        return result.success ? { ...currentState, preferences: result.data } : currentState;
      },
      partialize: ({ preferences }) => ({ preferences }),
    }
  )
);

export function getPreferences(): Preferences {
  return preferencesStore.getState().preferences;
}

export const usePreferences = (): Preferences => useStore(preferencesStore, (state) => state.preferences);

// Applies a partial preferences update through the store's validation boundary.
export const updatePreferences = (preferencesInput: PartialPreferences): void => {
  preferencesStore.setState((state) => {
    const { selectedTags, ...study } = preferencesInput.study ?? {};
    if (preferencesInput.loadSample !== undefined) state.preferences.loadSample = preferencesInput.loadSample;
    if (preferencesInput.language !== undefined) state.preferences.language = preferencesInput.language;
    Object.assign(state.preferences.appearance, preferencesInput.appearance);
    Object.assign(state.preferences.study, study);
    Object.assign(state.preferences.controls, preferencesInput.controls);
    if (selectedTags != null) state.preferences.study.selectedTags = [...selectedTags];
    state.preferences = preferencesSchema.parse(state.preferences);
  });
};

/** Replaces the whole snapshot so deterministic fixtures never inherit earlier store state. */
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

export function toggleShowViewMode(): void {
  updatePreferences({ controls: { showViewMode: !getPreferences().controls.showViewMode } });
}

export function toggleViewMode(): void {
  updatePreferences({ controls: { viewMode: !getPreferences().controls.viewMode } });
}

export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });

export const toggleShowCardDetails = (): void => {
  updatePreferences({ controls: { showCardDetails: !getPreferences().controls.showCardDetails } });
};

export function toggleShowEditLink(): void {
  updatePreferences({ controls: { showEditLink: !getPreferences().controls.showEditLink } });
}

export const toggleShowHelp = (): void => {
  updatePreferences({ controls: { showHelp: !getPreferences().controls.showHelp } });
};

export const toggleShowPlaybackControls = (): void => {
  updatePreferences({ controls: { showPlaybackControls: !getPreferences().controls.showPlaybackControls } });
};

export const toggleShowSkip = (): void => {
  updatePreferences({ controls: { showSkip: !getPreferences().controls.showSkip } });
};

export const toggleShowSwipeButtonList = (): void => {
  updatePreferences({ controls: { showSwipeButtonList: !getPreferences().controls.showSwipeButtonList } });
};
