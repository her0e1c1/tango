import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

// Toggles whether the study Help shortcut is shown.
export const toggleShowHelp = (): void => {
  const { showHelp } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showHelp: !showHelp } });
};
