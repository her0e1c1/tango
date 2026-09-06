import { studyPreferencesLimits, usePreferences } from "@/entities/preference";

import { usePreferencesAutoSave } from "./usePreferencesAutoSave";
import { usePreferencesDarkModeSync } from "./usePreferencesDarkModeSync";
import { usePreferencesForm } from "./usePreferencesForm";

export const useSettingsPageModel = () => {
  const preferences = usePreferences();
  const form = usePreferencesForm(preferences);
  const { handleSubmit, setValue, subscribe } = form;

  usePreferencesDarkModeSync(setValue, preferences.appearance.darkMode);
  usePreferencesAutoSave(subscribe, handleSubmit);

  return { form, studyPreferencesLimits };
};
