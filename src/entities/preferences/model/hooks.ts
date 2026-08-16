import { useStore } from "zustand";

import { preferencesStore } from "./store";
import type { Preferences } from "./types";

// Reads the complete validated user preferences state.
export const usePreferences = (): Preferences => useStore(preferencesStore, (state) => state.preferences);
