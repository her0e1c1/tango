import type { UseFormHandleSubmit } from "react-hook-form";

import { type Preferences, updatePreferences } from "@/entities/preference";

export function savePreferencesForm(handleSubmit: UseFormHandleSubmit<Preferences>): Promise<void> {
  return handleSubmit(updatePreferences)();
}
