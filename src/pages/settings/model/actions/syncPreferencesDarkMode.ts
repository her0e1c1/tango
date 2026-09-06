import type { UseFormSetValue } from "react-hook-form";

import type { Preferences } from "@/entities/preference";

export function syncPreferencesDarkMode(setValue: UseFormSetValue<Preferences>, darkMode: boolean): void {
  // The header can change the theme while Settings is open; preserve the other form values.
  setValue("appearance.darkMode", darkMode);
}
