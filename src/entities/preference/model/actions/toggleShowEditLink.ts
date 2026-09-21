import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

export function toggleShowEditLink(): void {
  const { showEditLink } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showEditLink: !showEditLink } });
}
