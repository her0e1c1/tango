import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { defaultPreferences } from "./defaults";
import { persistedPreferencesSchema } from "./schema";
import type { Preferences } from "./types";

const PREFERENCES_STORAGE_KEY = "tango-config";
// Keep this stable for safely defaultable additions; a dedicated task must justify invalidating existing preferences.
const PREFERENCES_STORAGE_VERSION = 1;

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
