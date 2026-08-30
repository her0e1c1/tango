import { Component, type ReactNode } from "react";

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

export const AppErrorFallback = () => (
  <RouteFeedback
    title="Something went wrong"
    description="Tango encountered an unexpected error. Reload the app to try again."
    tone="error"
    primaryAction={{ label: "Reload", onClick: reloadPage }}
  />
);

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
