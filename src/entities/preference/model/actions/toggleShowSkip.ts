import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

// Toggles whether the study session skip control is shown.
export const toggleShowSkip = (): void => {
  const { showSkip } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showSkip: !showSkip } });
};
