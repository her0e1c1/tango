import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

// Toggles whether study card details are shown.
export const toggleShowCardDetails = (): void => {
  const { showCardDetails } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showCardDetails: !showCardDetails } });
};
