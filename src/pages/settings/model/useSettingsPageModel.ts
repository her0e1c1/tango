import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { routes } from "@/shared/router";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { type Preferences, studyPreferencesLimits, updatePreferences, usePreferences } from "@/entities/preference";

export const useSettingsPageModel = () => {
  const navigate = useNavigate();
  useKey("t", () => void navigate(routes.deckList.to()));
  const preferences = usePreferences();
  const form = useForm<Preferences>({ defaultValues: preferences });

  const { setValue, subscribe } = form;
  const darkMode = preferences.appearance.darkMode;
  useEffect(() => {
    // The header can change the theme while Settings is open; preserve the other form values.
    setValue("appearance.darkMode", darkMode);
  }, [setValue, darkMode]);

  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: ({ values }) => updatePreferences(values),
      }),
    [subscribe]
  );

  return { form, studyPreferencesLimits };
};
