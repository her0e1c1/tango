import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ConfigFormProps } from "@/features/settings/components/ConfigForm";

export interface UseConfigFormStateOptions {
  config: ConfigState;
  onSubmit?: (config: ConfigState) => void;
  isLoggedIn?: boolean;
  identity?: ConfigFormProps["identity"];
  onLogin?: () => void;
  onLogout?: () => void;
  version?: string;
}

export const useConfigFormState = ({
  config,
  onSubmit,
  isLoggedIn,
  identity,
  onLogin,
  onLogout,
  version,
}: UseConfigFormStateOptions): ConfigFormProps => {
  const { control, handleSubmit, register, setValue, subscribe } = useForm<ConfigState>({
    defaultValues: config,
  });
  const maxNumberOfCardsToLearn = useWatch({ control, name: "maxNumberOfCardsToLearn" });
  const cardInterval = useWatch({ control, name: "cardInterval" });

  React.useEffect(() => {
    return subscribe({
      formState: { values: true },
      callback: () => void handleSubmit((data) => onSubmit?.(data))(),
    });
  }, [handleSubmit, onSubmit, subscribe]);

  React.useEffect(() => {
    setValue("darkMode", config.darkMode);
  }, [config.darkMode, setValue]);

  return {
    config,
    ...(isLoggedIn !== undefined ? { isLoggedIn } : {}),
    ...(identity !== undefined ? { identity } : {}),
    ...(onLogin !== undefined ? { onLogin } : {}),
    ...(onLogout !== undefined ? { onLogout } : {}),
    ...(version !== undefined ? { version } : {}),
    maxNumberOfCardsToLearn,
    cardInterval,
    fields: {
      showHeader: register("showHeader"),
      showSwipeButtonList: register("showSwipeButtonList"),
      showSwipeFeedback: register("showSwipeFeedback"),
      darkMode: register("darkMode"),
      shuffled: register("shuffled"),
      useCardInterval: register("useCardInterval"),
      maxNumberOfCardsToLearn: {
        ...register("maxNumberOfCardsToLearn", { valueAsNumber: true }),
        min: 0,
        max: 100,
      },
      defaultAutoPlay: register("defaultAutoPlay"),
      cardInterval: {
        ...register("cardInterval", { valueAsNumber: true }),
        min: 0,
        max: 60,
      },
      githubAccessToken: register("githubAccessToken"),
    },
  };
};
