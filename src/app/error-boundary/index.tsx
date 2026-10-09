import { Component, type ReactNode, useLayoutEffect, useState } from "react";

import { useTranslation } from "react-i18next";
import { appI18n } from "../i18n/instance";
import { getRecoveryMessages } from "../i18n/resources";

import { clearLocalDataAndReload, isLocalDataResetRequested } from "./clear-local-data";

import { RouteFeedback, type RouteFeedbackProps } from "@/shared/ui/route-feedback";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

const reloadPage = () => {
  // A full reload discards the failed React tree; resetting only the boundary could render the same fault again.
  window.location.reload();
};

function useRecoveryMessages() {
  // The standalone instance retains the active locale without reading persisted preferences.
  const { i18n } = useTranslation(undefined, { i18n: appI18n });
  const messages = getRecoveryMessages(i18n.resolvedLanguage);
  useLayoutEffect(() => {
    document.documentElement.lang = messages.language;
  }, [messages.language]);
  return messages;
}

interface AppErrorFallbackProps {
  title?: string;
  description?: string;
  error?: unknown;
  allowLocalDataReset?: boolean;
}

export function AppErrorFallback({ title, description, error, allowLocalDataReset = false }: AppErrorFallbackProps) {
  const messages = useRecoveryMessages();
  const [status, setStatus] = useState<"idle" | "clearing" | "failed">("idle");

  function clearData() {
    setStatus("clearing");
    void clearLocalDataAndReload().catch(() => setStatus("failed"));
  }

  const detail = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const feedback: RouteFeedbackProps = {
    title: title ?? messages.title,
    description: [
      description,
      allowLocalDataReset ? messages.localDataDescription : messages.description,
      detail,
      status === "clearing" && messages.clearing,
      status === "failed" && messages.clearFailed,
    ]
      .filter(Boolean)
      .join(" "),
    tone: "error",
  };

  if (status !== "clearing") {
    feedback.primaryAction = { label: messages.reload, onClick: reloadPage };
    if (allowLocalDataReset) {
      feedback.secondaryAction = {
        label: messages.clearLocalData,
        onClick: clearData,
        variant: "destructive",
      };
    }
  }

  return <RouteFeedback {...feedback} />;
}

// React requires a class to define an Error Boundary without another dependency.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false };

  private readonly showFailure = (error: unknown) => {
    this.setState((state) => (state.hasError ? null : { hasError: true, error }));
  };

  private readonly handleWindowError = (event: ErrorEvent) => {
    // Resource load events are not runtime exceptions.
    if (event instanceof ErrorEvent) this.showFailure(event.error ?? event.message);
  };

  private readonly handleRejection = (event: PromiseRejectionEvent) => {
    this.showFailure(event.reason);
  };

  override componentDidMount(): void {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleRejection);
  }

  override componentWillUnmount(): void {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    let resetting = false;
    try {
      resetting = isLocalDataResetRequested();
    } catch {
      // Storage access may be the startup failure; recovery must still render without it.
    }
    return (
      <AppErrorFallback
        error={this.state.error}
        allowLocalDataReset={resetting}
        description={resetting ? getRecoveryMessages(appI18n.resolvedLanguage).clearFailed : ""}
      />
    );
  }
}
