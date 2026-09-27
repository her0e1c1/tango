import { Component, type ReactNode } from "react";
import { AppErrorFallback } from "./AppErrorFallback";

export { AppErrorFallback } from "./AppErrorFallback";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error?: unknown;
}

// biome-ignore lint/style/useReactFunctionComponents: React requires a class to define an Error Boundary without another dependency.
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  override state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidMount(): void {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleRejection);
  }

  override componentWillUnmount(): void {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener("unhandledrejection", this.handleRejection);
  }

  private readonly showFailure = (error: unknown) => {
    // Keep the first failure and avoid interrupting recovery when more errors arrive.
    this.setState((state) => {
      if (state.hasError) return null;
      return { hasError: true, error };
    });
  };

  private readonly handleWindowError = (event: ErrorEvent) => {
    // Resource load events are not runtime exceptions.
    if (!(event instanceof ErrorEvent)) return;
    this.showFailure(event.error ?? event.message);
  };

  private readonly handleRejection = (event: PromiseRejectionEvent) => {
    this.showFailure(event.reason);
  };

  override render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return <AppErrorFallback error={this.state.error} />;
  }
}
