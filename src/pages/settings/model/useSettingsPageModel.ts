import { useEffect } from "react";
import { type UseFormReturn, useForm } from "react-hook-form";

import { type Preferences, studyPreferencesLimits, usePreferences } from "@/entities/preference";

import { savePreferencesForm } from "./actions/savePreferencesForm";
import { syncPreferencesDarkMode } from "./actions/syncPreferencesDarkMode";

export const useSettingsPageModel = () => {
  const preferences = usePreferences();
  const form = useForm<Preferences>({ defaultValues: preferences });

  usePreferencesSync(form, preferences.appearance.darkMode);

  return { form, studyPreferencesLimits };
};

function usePreferencesSync(
  { setValue, subscribe, handleSubmit }: Pick<UseFormReturn<Preferences>, "setValue" | "subscribe" | "handleSubmit">,
  darkMode: boolean
): void {
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
}
