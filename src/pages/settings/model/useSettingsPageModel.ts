import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type Preferences, studyPreferencesLimits, updatePreferences, usePreferences } from "@/entities/preference";

export const useSettingsPageModel = () => {
  const preferences = usePreferences();
  const form = useForm<Preferences>({ defaultValues: preferences });

  const { setValue, subscribe, handleSubmit } = form;
  const darkMode = preferences.appearance.darkMode;
  useEffect(() => {
    // The header can change the theme while Settings is open; preserve the other form values.
    setValue("appearance.darkMode", darkMode);
  }, [setValue, darkMode]);

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void handleSubmit(updatePreferences)(),
      }),
    [subscribe, handleSubmit]
  );

  return { form, studyPreferencesLimits };
};
