/**
 * @file Defines the reusable Remote Read Boundary component in the shared feedback library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import type { ReactNode } from "react";

import { RouteFeedback } from "@/shared/ui/route-feedback";

export type RemoteReadBoundaryProps = {
  status: "idle" | "loading" | "ready" | "error" | "blocked";
  hasData: boolean;
  emptyLabel?: string;
  emptyContent?: ReactNode;
  children: ReactNode;
};

/**
 * Renders the Error Notice user interface.
 * Explains whether loading failed completely or synchronization stopped after data arrived.
 */
const ErrorNotice = ({ hasData }: Pick<RemoteReadBoundaryProps, "hasData">) => (
  <div
    role="alert"
    className="mb-4 flex items-center justify-between gap-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200"
  >
    <span>{hasData ? "Sync interrupted. Showing current data." : "Unable to load data."}</span>
  </div>
);

/**
 * Renders the Remote Read Boundary user interface.
 * Chooses blocked, loading, error, refreshing, or ready content from the remote-read status
 * supplied by its parent.
 */
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
    return <RouteFeedback title="Unable to load data." tone="error" />;
  }
  if (props.status === "ready" && !props.hasData) {
    return props.emptyContent ?? <RouteFeedback title={props.emptyLabel ?? "No data yet."} tone="not-found" />;
  }

  return (
    <>
      {props.status === "error" && <ErrorNotice hasData />}
      {props.children}
    </>
  );
};
