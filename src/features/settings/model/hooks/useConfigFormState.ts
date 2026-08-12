/**
 * @file Provides the settings feature's Use Config Form State React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { ConfigState } from "@/shared/config";

import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ConfigFormProps } from "@/features/settings/ui/components/ConfigForm";

export interface UseConfigFormStateOptions {
  config: ConfigState;
  onSubmit?: (config: ConfigState) => void;
  isLoggedIn?: boolean;
  identity?: ConfigFormProps["identity"];
  onLogin?: () => void;
  onLogout?: () => void;
  accountPending?: boolean;
  accountFeedback?: React.ReactNode;
  version?: string;
}

/**
 * Provides the config form state values and operations needed by React components.
 * Callers receive one focused interface without coordinating the settings feature's stores and
 * services themselves.
 */
export const useConfigFormState = ({
  config,
  onSubmit,
  isLoggedIn,
  identity,
  onLogin,
  onLogout,
  accountPending,
  accountFeedback,
  version,
}: UseConfigFormStateOptions): ConfigFormProps => {
  const { control, handleSubmit, register, setValue, subscribe } = useForm<ConfigState>({
    defaultValues: config,
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
    setValue("appearance.darkMode", config.appearance.darkMode);
  }, [config.appearance.darkMode, setValue]);

  return {
    config,
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
