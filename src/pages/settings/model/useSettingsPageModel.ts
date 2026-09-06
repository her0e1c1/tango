import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type Preferences, studyPreferencesLimits, usePreferences } from "@/entities/preference";

import { savePreferencesForm } from "./actions/savePreferencesForm";
import { syncPreferencesDarkMode } from "./actions/syncPreferencesDarkMode";

export const useSettingsPageModel = () => {
  const preferences = usePreferences();
  const form = useForm<Preferences>({ defaultValues: preferences });

  const { setValue, subscribe, handleSubmit } = form;
  const darkMode = preferences.appearance.darkMode;
  useEffect(() => {
    syncPreferencesDarkMode(setValue, darkMode);
  }, [setValue, darkMode]);

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void savePreferencesForm(handleSubmit),
      }),
    [subscribe, handleSubmit]
  );

  return { form, studyPreferencesLimits };
};
