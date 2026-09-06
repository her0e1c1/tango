import { preferencesSchema } from "../schema";
import { preferencesStore } from "../store";
import type { PartialPreferences } from "../types";

// Applies a partial preferences update through the store's validation boundary.
export const updatePreferences = (preferencesInput: PartialPreferences): void => {
  preferencesStore.setState((state) => {
    const { selectedTags, ...study } = preferencesInput.study ?? {};
    if (preferencesInput.loadSample !== undefined) state.preferences.loadSample = preferencesInput.loadSample;
    if (preferencesInput.language !== undefined) state.preferences.language = preferencesInput.language;
    Object.assign(state.preferences.appearance, preferencesInput.appearance);
    Object.assign(state.preferences.study, study);
    Object.assign(state.preferences.controls, preferencesInput.controls);
    if (selectedTags != null) {
      // Do not retain a caller-owned mutable array inside persisted state.
      state.preferences.study.selectedTags = [...selectedTags];
    }
    state.preferences = preferencesSchema.parse(state.preferences);
  });
};
