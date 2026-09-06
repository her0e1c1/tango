import type { Preferences } from "@/entities/preference";

import { useForm } from "react-hook-form";

export const usePreferencesForm = (preferences: Preferences) =>
  useForm<Preferences>({
    defaultValues: preferences,
  });
