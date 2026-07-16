import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import type { ConfigFormProps } from "@/features/settings/components/ConfigForm";
import { renameKey } from "@/shared/forms/renameKey";

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
  const { control, handleSubmit, register, setValue, watch } = useForm<ConfigState>({
    defaultValues: config,
  });
  const maxNumberOfCardsToLearn = useWatch({ control, name: "maxNumberOfCardsToLearn" });
  const cardInterval = useWatch({ control, name: "cardInterval" });

  React.useEffect(() => {
    const subscription = watch(() => {
      void handleSubmit((data) => onSubmit?.(data))();
    });
    return () => subscription.unsubscribe();
  }, [handleSubmit, onSubmit, watch]);

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
      showHeader: renameKey(register("showHeader")),
      showSwipeButtonList: renameKey(register("showSwipeButtonList")),
      showSwipeFeedback: renameKey(register("showSwipeFeedback")),
      darkMode: renameKey(register("darkMode")),
      localMode: renameKey(register("localMode")),
      shuffled: renameKey(register("shuffled")),
      useCardInterval: renameKey(register("useCardInterval")),
      maxNumberOfCardsToLearn: {
        ...renameKey(register("maxNumberOfCardsToLearn", { valueAsNumber: true })),
        min: 0,
        max: 100,
      },
      defaultAutoPlay: renameKey(register("defaultAutoPlay")),
      cardInterval: {
        ...renameKey(register("cardInterval", { valueAsNumber: true })),
        min: 0,
        max: 60,
      },
      githubAccessToken: renameKey(register("githubAccessToken")),
    },
  };
};
