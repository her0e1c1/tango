import { preferencesStore } from "../store";
import type { Preferences } from "../types";

export function getPreferences(): Preferences {
  const state = preferencesStore.getState();
  return state.preferences;
}
