import { studyPreferencesLimits, type Preferences, updatePreferences, usePreferences } from "@/entities/preference";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

export const usePreferencesFormState = () => {
  const preferences = usePreferences();
  const { control, handleSubmit, register, setValue, subscribe } = useForm<Preferences>({
    defaultValues: preferences,
  });
  const maxNumberOfCardsToLearn = useWatch({ control, name: "study.maxNumberOfCardsToLearn" });
  const cardInterval = useWatch({ control, name: "study.cardInterval" });

  React.useEffect(
    () =>
      subscribe({
        formState: { values: true },
        callback: () => void handleSubmit(updatePreferences)(),
      }),
    [handleSubmit, subscribe]
  );

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
      min: studyPreferencesLimits.maxNumberOfCardsToLearn.min,
      max: studyPreferencesLimits.maxNumberOfCardsToLearn.max,
    },
    defaultAutoPlay: register("study.defaultAutoPlay"),
    cardInterval: {
      ...register("study.cardInterval", { valueAsNumber: true }),
      min: studyPreferencesLimits.cardInterval.min,
      max: studyPreferencesLimits.cardInterval.max,
    },
  };

  return {
    maxNumberOfCardsToLearn,
    cardInterval,
    fields,
  };
};
