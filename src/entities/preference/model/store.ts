import { useStore } from "zustand";
import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { persistedPreferencesSchema, preferencesSchema } from "./schema";
import type { PartialPreferences, Preferences } from "./types";

const PREFERENCES_STORAGE_KEY = "tango-config";
const PREFERENCES_STORAGE_VERSION = 1;

const defaultPreferences: Preferences = preferencesSchema.parse({});
Object.freeze(defaultPreferences.study.selectedTags);
Object.freeze(defaultPreferences.appearance);
Object.freeze(defaultPreferences.study);
Object.freeze(defaultPreferences.controls);
Object.freeze(defaultPreferences);

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

export const replacePreferences = (input: PartialPreferences): void => {
  const preferences = preferencesSchema.parse(input);
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: { ...preferences.study, selectedTags: [...preferences.study.selectedTags] },
    },
  });
};

export function toggleShowViewMode(): void {
  const { showViewMode } = getPreferences().controls;
  updatePreferences({ controls: { showViewMode: !showViewMode } });
}

export function toggleViewMode(): void {
  updatePreferences({ controls: { viewMode: !getPreferences().controls.viewMode } });
}

export const setDarkMode = (darkMode: boolean): void => updatePreferences({ appearance: { darkMode } });

export const toggleShowCardDetails = (): void => {
  const { showCardDetails } = getPreferences().controls;
  updatePreferences({ controls: { showCardDetails: !showCardDetails } });
};

export function toggleShowEditLink(): void {
  const { showEditLink } = getPreferences().controls;
  updatePreferences({ controls: { showEditLink: !showEditLink } });
}

export const toggleShowHelp = (): void => {
  const { showHelp } = getPreferences().controls;
  updatePreferences({ controls: { showHelp: !showHelp } });
};

export const toggleShowPlaybackControls = (): void => {
  const { showPlaybackControls } = getPreferences().controls;
  updatePreferences({ controls: { showPlaybackControls: !showPlaybackControls } });
};

export const toggleShowSkip = (): void => {
  const { showSkip } = getPreferences().controls;
  updatePreferences({ controls: { showSkip: !showSkip } });
};

export const toggleShowSwipeButtonList = (): void => {
  const { showSwipeButtonList } = getPreferences().controls;
  updatePreferences({ controls: { showSwipeButtonList: !showSwipeButtonList } });
};
