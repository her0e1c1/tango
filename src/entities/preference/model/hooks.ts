import { useStore } from "zustand";

import { preferencesStore } from "./store";
import type { Preferences } from "./types";

export const usePreferences = (): Preferences => useStore(preferencesStore, (state) => state.preferences);
