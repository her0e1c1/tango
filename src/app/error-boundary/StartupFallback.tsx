import { useLayoutEffect } from "react";
import { appI18n } from "../i18n/instance";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { getRecoveryMessages } from "../i18n/resources";

export function StartupFallback() {
  const messages = getRecoveryMessages();
  useLayoutEffect(() => {
    document.documentElement.lang = messages.language;
    void appI18n.changeLanguage(messages.language);
  }, [messages.language]);
  return <RouteFeedback title={messages.starting} tone="loading" />;
}
