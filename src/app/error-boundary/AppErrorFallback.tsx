import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { appI18n } from "../i18n/instance";
import { getRecoveryMessages } from "../i18n/resources";
import { clearCacheAndReload } from "./clear-cache";

interface AppErrorFallbackProps {
  title?: string;
  description?: string;
  error?: unknown;
}

function reloadPage() {
  // A full reload discards the failed React tree; resetting only the boundary could render the same fault again.
  window.location.reload();
}

function useRecoveryMessages() {
  // The standalone instance retains the active locale without reading persisted preferences.
  const { i18n } = useTranslation(undefined, { i18n: appI18n });
  const messages = getRecoveryMessages(i18n.resolvedLanguage);
  useLayoutEffect(() => {
    document.documentElement.lang = messages.language;
  }, [messages.language]);
  return messages;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "";
}

export function AppErrorFallback({ title, description, error }: AppErrorFallbackProps) {
  const messages = useRecoveryMessages();
  const detail = getErrorMessage(error);
  const feedbackDescription = [description ?? messages.description, detail].filter(Boolean).join(" ");
  return (
    <RouteFeedback
      title={title ?? messages.title}
      description={feedbackDescription}
      tone="error"
      primaryAction={{ label: messages.reload, onClick: reloadPage }}
      secondaryAction={{
        label: messages.clearCache,
        onClick: () => void clearCacheAndReload(messages.language),
      }}
    />
  );
}
