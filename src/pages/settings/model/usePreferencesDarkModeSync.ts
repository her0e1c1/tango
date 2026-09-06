import { useEffect } from "react";
import type { UseFormSetValue } from "react-hook-form";

import type { Preferences } from "@/entities/preference";
import { syncPreferencesDarkMode } from "./actions/syncPreferencesDarkMode";

export const usePreferencesDarkModeSync = (setValue: UseFormSetValue<Preferences>, darkMode: boolean): void => {
  useEffect(() => {
    syncPreferencesDarkMode(setValue, darkMode);
  }, [setValue, darkMode]);
};
