import type { ReactNode } from "react";

import { Button } from "@/components/forms/Button";
import { RouteFeedback } from "@/components/feedback/RouteFeedback";

export type RemoteReadBoundaryProps = {
  status: "idle" | "loading" | "ready" | "error" | "blocked";
  hasData: boolean;
  emptyLabel?: string;
  emptyContent?: ReactNode;
  onRetry: () => void;
  children: ReactNode;
};

const ErrorNotice = ({ hasData, onRetry }: Pick<RemoteReadBoundaryProps, "hasData" | "onRetry">) => (
  <div
    role="alert"
    className="mb-4 flex items-center justify-between gap-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
  >
    <span>{hasData ? "Sync interrupted. Showing current data." : "Unable to load data."}</span>
    <Button small onClick={onRetry}>
      Retry
    </Button>
  </div>
);

export const RemoteReadBoundary = (props: RemoteReadBoundaryProps) => {
  if (props.status === "blocked") {
    return (
      <RouteFeedback
        title="Offline storage is unavailable."
        description="Close other tabs or use a supported browser, then reload this page."
        tone="error"
      />
    );
  }
  if (props.status === "loading" && !props.hasData) return <RouteFeedback title="Loading…" tone="loading" />;
  if (props.status === "error" && !props.hasData) {
    return (
      <RouteFeedback
        title="Unable to load data."
        tone="error"
        primaryAction={{ label: "Retry", onClick: props.onRetry }}
      />
    );
  }
  if (props.status === "ready" && !props.hasData) {
    return props.emptyContent ?? <RouteFeedback title={props.emptyLabel ?? "No data yet."} tone="not-found" />;
  }

  return (
    <>
      {props.status === "error" && <ErrorNotice hasData onRetry={props.onRetry} />}
      {props.children}
    </>
  );
};
