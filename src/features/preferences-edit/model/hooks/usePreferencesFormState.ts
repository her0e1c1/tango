import type { Preferences } from "@/entities/preferences";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

export interface UsePreferencesFormStateOptions {
  preferences: Preferences;
  onSubmit?: (preferences: Preferences) => void;
}

export const usePreferencesFormState = ({ preferences, onSubmit }: UsePreferencesFormStateOptions) => {
  const { control, handleSubmit, register, setValue, subscribe } = useForm<Preferences>({
    defaultValues: preferences,
  });
  const maxNumberOfCardsToLearn = useWatch({ control, name: "study.maxNumberOfCardsToLearn" });
  const cardInterval = useWatch({ control, name: "study.cardInterval" });

  React.useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: () => void handleSubmit((data) => onSubmit?.(data))(),
    });
  }, [handleSubmit, onSubmit, subscribe]);

  React.useEffect(() => {
    setValue("appearance.darkMode", preferences.appearance.darkMode);
  }, [preferences.appearance.darkMode, setValue]);

  const fields = {
    showHeader: register("appearance.showHeader"),
    showSwipeButtonList: register("controls.showSwipeButtonList"),
    showSwipeFeedback: register("appearance.showSwipeFeedback"),
    darkMode: register("appearance.darkMode"),
    shuffled: register("study.shuffled"),
    useCardInterval: register("study.useCardInterval"),
    maxNumberOfCardsToLearn: {
      ...register("study.maxNumberOfCardsToLearn", { valueAsNumber: true }),
      min: 0,
      max: 100,
    },
    defaultAutoPlay: register("study.defaultAutoPlay"),
    cardInterval: {
      ...register("study.cardInterval", { valueAsNumber: true }),
      min: 0,
      max: 60,
    },
  };

  return {
    maxNumberOfCardsToLearn,
    cardInterval,
    fields,
  };
};
