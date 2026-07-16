import type { ReactNode } from "react";

import { Button } from "@/shared/components/forms/Button";

type RemoteReadBoundaryProps = {
  status: "idle" | "loading" | "ready" | "error";
  hasData: boolean;
  emptyLabel?: string;
  onRetry: () => void;
  children: ReactNode;
};

const Status = ({ children }: { children: ReactNode }) => (
  <div role="status" className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
    {children}
  </div>
);

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
  if (props.status === "loading" && !props.hasData) return <Status>Loading…</Status>;
  if (props.status === "error" && !props.hasData) {
    return <ErrorNotice hasData={false} onRetry={props.onRetry} />;
  }
  if (props.status === "ready" && !props.hasData) return <Status>{props.emptyLabel ?? "No data yet."}</Status>;

  return (
    <>
      {props.status === "error" && <ErrorNotice hasData onRetry={props.onRetry} />}
      {props.children}
    </>
  );
};
