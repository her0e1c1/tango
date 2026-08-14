import { useStore } from "zustand";

import type { Preferences } from "./preferences";
import { preferencesStore } from "./store";

export const usePreferences = (): Preferences => useStore(preferencesStore, (state) => state.preferences);
