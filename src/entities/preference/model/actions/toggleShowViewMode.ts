import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

export function toggleShowViewMode(): void {
  const { showViewMode } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showViewMode: !showViewMode } });
}
