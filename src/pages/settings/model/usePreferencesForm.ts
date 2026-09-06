import type { Preferences } from "@/entities/preference";

import * as React from "react";
import { useForm } from "react-hook-form";

export const usePreferencesForm = (preferences: Preferences) => {
  const form = useForm<Preferences>({
    defaultValues: preferences,
  });
  const { setValue } = form;

  React.useEffect(() => {
    setValue("appearance.darkMode", preferences.appearance.darkMode);
  }, [preferences.appearance.darkMode, setValue]);

  return form;
};
