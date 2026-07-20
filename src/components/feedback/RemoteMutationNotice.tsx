/**
 * @file Defines the reusable Remote Mutation Notice component in the shared feedback library.
 * Feature screens compose this building block through props instead of duplicating presentation
 * and interaction rules.
 */

import { Button } from "@/components/forms/Button";

export interface RemoteMutationNoticeProps {
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  showPending?: boolean;
  pendingLabel?: string;
  errorLabel?: string;
}

/**
 * Renders the Remote Mutation Notice user interface.
 * Translates mutation progress or failure into a concise status notice and exposes retry when
 * recovery is available.
 */
export const RemoteMutationNotice = (props: RemoteMutationNoticeProps) => {
  const pendingLabel = props.pendingLabel ?? "Saving…";
  const errorLabel = props.errorLabel ?? "Unable to save changes.";

  if (props.error != null) {
    return (
      <div role="alert" className="my-2 flex items-center justify-between rounded border border-red-300 p-2 text-sm">
        <span>{errorLabel}</span>
        <Button small onClick={props.onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  if (!props.pending || props.showPending === false) return null;
  return (
    <div role="status" className="my-2 text-sm text-gray-500">
      {pendingLabel}
    </div>
  );
};
