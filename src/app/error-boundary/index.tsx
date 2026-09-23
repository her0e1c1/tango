import { Component, type ReactNode, useLayoutEffect } from "react";

import { useTranslation } from "react-i18next";
import { appI18n } from "../i18n/instance";
import { getRecoveryMessages } from "../i18n/resources";
import { requestApplicationReset } from "./reset";

import { RouteFeedback } from "@/shared/ui/route-feedback";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
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

export function AppStartupFallback() {
  const messages = useRecoveryMessages();
  return <RouteFeedback title={messages.starting} tone="loading" />;
}

export function AppErrorFallback({ title, description }: { title?: string; description?: string }) {
  const messages = useRecoveryMessages();
  return (
    <RouteFeedback
      title={title ?? messages.title}
      description={description ?? messages.description}
      tone="error"
      primaryAction={{ label: messages.reload, onClick: reloadPage }}
      secondaryAction={{
        label: messages.reset,
        onClick: () => requestApplicationReset(messages.language),
      }}
    />
  );
}

// biome-ignore lint/style/useReactFunctionComponents: React requires a class to define an Error Boundary without another dependency.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false };

  private readonly showFailure = () => {
    this.setState((state) => (state.hasError ? null : { hasError: true }));
  };

  private readonly handleWindowError = (event: ErrorEvent) => {
    // Resource load events are not runtime exceptions.
    if (event instanceof ErrorEvent) this.showFailure();
  };

  override componentDidMount(): void {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.showFailure);
  }

  override componentWillUnmount(): void {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.showFailure);
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return <AppErrorFallback />;
  }
}
