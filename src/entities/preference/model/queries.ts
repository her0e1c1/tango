import { preferencesStore } from "./store";
import type { Preferences } from "./types";

export function getPreferences(): Preferences {
  return preferencesStore.getState().preferences;
}
