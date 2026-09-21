import React from "react";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "@/entities/auth";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { getRecoveryMessages } from "../recovery/messages";
import { requestApplicationReset } from "../recovery/reset";
import { startAuthSession } from "./lifecycle";

export interface AuthProviderProps {
  children: React.ReactNode;
  reload?: (() => void) | undefined;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children, reload = () => window.location.reload() }) => {
  const { t, i18n } = useTranslation();
  const authState = useAuthSession();

  React.useEffect(() => {
    const stopAuthSession = startAuthSession();
    return stopAuthSession;
  }, []);

  if (
    authState.status === "initializing" ||
    authState.status === "unauthenticated" ||
    authState.status === "authenticating"
  ) {
    return (
      <RouteFeedback title={t("auth.starting.title")} description={t("auth.starting.description")} tone="loading" />
    );
  }

  if (authState.status === "error") {
    return (
      <RouteFeedback
        title={t("auth.failure.title")}
        description={t("auth.failure.description")}
        tone="error"
        primaryAction={{ label: t("recovery.reload"), onClick: reload }}
        secondaryAction={{
          label: getRecoveryMessages(i18n.resolvedLanguage).reset,
          onClick: () => requestApplicationReset(i18n.resolvedLanguage),
        }}
      />
    );
  }

  return children;
};
