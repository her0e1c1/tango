/**
 * @file Provides the settings feature's Use Preferences Form State React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Preferences } from "@/entities/preferences";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { PreferencesFormProps } from "../../ui/components/PreferencesForm";

export interface UsePreferencesFormStateOptions {
  preferences: Preferences;
  onSubmit?: (preferences: Preferences) => void;
  isLoggedIn?: boolean;
  identity?: PreferencesFormProps["identity"];
  onLogin?: () => void;
  onLogout?: () => void;
  accountPending?: boolean;
  accountFeedback?: React.ReactNode;
  version?: string;
}

/**
 * Provides the preferences form state values and operations needed by React components.
 * Callers receive one focused interface without coordinating the settings feature's stores and
 * services themselves.
 */
export const usePreferencesFormState = ({
  preferences,
  onSubmit,
  isLoggedIn,
  identity,
  onLogin,
  onLogout,
  accountPending,
  accountFeedback,
  version,
}: UsePreferencesFormStateOptions): PreferencesFormProps => {
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

  return {
    preferences,
    ...(isLoggedIn !== undefined ? { isLoggedIn } : {}),
    ...(identity !== undefined ? { identity } : {}),
    ...(onLogin !== undefined ? { onLogin } : {}),
    ...(onLogout !== undefined ? { onLogout } : {}),
    ...(accountPending !== undefined ? { accountPending } : {}),
    ...(accountFeedback !== undefined ? { accountFeedback } : {}),
    ...(version !== undefined ? { version } : {}),
    maxNumberOfCardsToLearn,
    cardInterval,
    fields: {
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
    },
  };
};
