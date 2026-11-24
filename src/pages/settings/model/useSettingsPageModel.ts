import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { routes } from "@/shared/router";
import { useForm } from "react-hook-form";

import { studyPreferencesLimits, updatePreferences, usePreferences } from "@/entities/preference";

import { getSettingsFormValues, type SettingsFormValues } from "./queries/getSettingsFormValues";

export const useSettingsPageModel = () => {
  const navigate = useNavigate();
  useKey("t", () => void navigate(routes.deckList.to()));
  const preferences = usePreferences();
  const form = useForm<SettingsFormValues>({ values: getSettingsFormValues(preferences) });

  return {
    form,
    onChange: () => updatePreferences(form.getValues()),
    studyPreferencesLimits,
    version: __APP_VERSION__,
    commitHash: __COMMIT_HASH__,
  };
};
