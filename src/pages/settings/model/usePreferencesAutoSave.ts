import { useEffect } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { Preferences } from "@/entities/preference";

export const usePreferencesAutoSave = (
  { subscribe, handleSubmit }: UseFormReturn<Preferences>,
  save: (preferences: Preferences) => void
): void => {
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void handleSubmit(save)(),
      }),
    [subscribe, handleSubmit, save]
  );
};
