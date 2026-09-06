import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

// Toggles whether study swipe controls are shown.
export const toggleShowSwipeButtonList = (): void => {
  const { showSwipeButtonList } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showSwipeButtonList: !showSwipeButtonList } });
};
