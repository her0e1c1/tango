import React from "react";
import { useTranslation } from "react-i18next";

import { useAuthSession } from "@/entities/auth";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { AppErrorFallback } from "../error-boundary";
import { startAuthSession } from "./lifecycle";

export interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { t } = useTranslation();
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
    return <AppErrorFallback title={t("auth.failure.title")} description={t("auth.failure.description")} />;
  }

  return children;
};
