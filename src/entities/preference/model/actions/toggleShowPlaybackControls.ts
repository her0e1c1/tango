import { preferencesStore } from "../store";
import { updatePreferences } from "./updatePreferences";

// Toggles whether study playback controls are shown.
export const toggleShowPlaybackControls = (): void => {
  const { showPlaybackControls } = preferencesStore.getState().preferences.controls;
  updatePreferences({ controls: { showPlaybackControls: !showPlaybackControls } });
};
