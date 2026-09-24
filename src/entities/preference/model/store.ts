import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { persistedPreferencesSchema, preferencesSchema } from "./schema";
import type { Preferences } from "./types";

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
