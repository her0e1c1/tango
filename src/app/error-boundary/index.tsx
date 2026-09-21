import { Component, type ReactNode, useLayoutEffect } from "react";

import { useTranslation } from "react-i18next";
import { appI18n } from "../i18n/instance";
import { getRecoveryMessages } from "../recovery/messages";
import { requestApplicationReset } from "../recovery/reset";

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

export const AppErrorFallback = () => {
  // This fallback also serves the boundary outside I18nProvider.
  const { t, i18n } = useTranslation(undefined, { i18n: appI18n });
  useLayoutEffect(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? "en";
  }, [i18n, i18n.resolvedLanguage]);
  return (
    <RouteFeedback
      title={t("recovery.title")}
      description={t("recovery.description")}
      tone="error"
      primaryAction={{ label: t("recovery.reload"), onClick: reloadPage }}
      secondaryAction={{
        label: getRecoveryMessages(i18n.resolvedLanguage).reset,
        onClick: () => requestApplicationReset(i18n.resolvedLanguage),
      }}
    />
  );
};

// biome-ignore lint/style/useReactFunctionComponents: React requires a class to define an Error Boundary without another dependency.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return <AppErrorFallback />;
  }
}
