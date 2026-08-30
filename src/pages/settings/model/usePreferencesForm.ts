import { studyPreferencesLimits, type Preferences, updatePreferences, usePreferences } from "@/entities/preference";

import * as React from "react";
import { useForm } from "react-hook-form";

export const usePreferencesForm = () => {
  const preferences = usePreferences();
  const form = useForm<Preferences>({
    defaultValues: preferences,
  });
  const { handleSubmit, setValue, subscribe } = form;

  React.useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void handleSubmit(updatePreferences)(),
      }),
    [handleSubmit, subscribe]
  );

  React.useEffect(() => {
    setValue("appearance.darkMode", preferences.appearance.darkMode);
  }, [preferences.appearance.darkMode, setValue]);

  return { form, studyPreferencesLimits };
};
