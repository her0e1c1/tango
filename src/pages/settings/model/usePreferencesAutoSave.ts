import { useEffect } from "react";
import type { UseFormHandleSubmit, UseFormSubscribe } from "react-hook-form";
import type { Preferences } from "@/entities/preference";

import { savePreferencesForm } from "./actions/savePreferencesForm";

export const usePreferencesAutoSave = (
  subscribe: UseFormSubscribe<Preferences>,
  handleSubmit: UseFormHandleSubmit<Preferences>
): void => {
  useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void savePreferencesForm(handleSubmit),
      }),
    [subscribe, handleSubmit]
  );
};
