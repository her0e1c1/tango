import { persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { createStore } from "zustand/vanilla";

import { defaultPreferences } from "./defaults";
import { preferencesSchema } from "./schema";
import type { Preferences } from "./types";

const PREFERENCES_STORAGE_KEY = "tango-config";
// Keep this stable for safely defaultable additions; a dedicated task must justify invalidating existing preferences.
const PREFERENCES_STORAGE_VERSION = 1;

/** Live validated preferences state. */
interface PreferencesStoreState {
  preferences: Preferences;
}

/** Browser-persisted subset of preferences state. */
interface PersistedPreferencesState {
  preferences: Preferences;
}

// Creates a persisted preferences store that validates hydrated data.
const createPreferencesStore = () =>
  createStore<PreferencesStoreState>()(
    persist<PreferencesStoreState, [], [["zustand/immer", never]], PersistedPreferencesState>(
      immer(() => ({ preferences: defaultPreferences })),
      {
        name: PREFERENCES_STORAGE_KEY,
        version: PREFERENCES_STORAGE_VERSION,
        merge: (persistedState, currentState) => {
          // Version-mismatched state is rejected before merge; validate only current-version state before replacing defaults.
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
