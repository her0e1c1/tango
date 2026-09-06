import { preferencesSchema } from "../schema";
import { preferencesStore } from "../store";
import type { PartialPreferences } from "../types";

/** Replaces the whole snapshot so deterministic fixtures never inherit earlier store state. */
export const replacePreferences = (input: PartialPreferences): void => {
  const preferences = preferencesSchema.parse(input);
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: {
        ...preferences.study,
        selectedTags: [...preferences.study.selectedTags],
      },
    },
  });
};
