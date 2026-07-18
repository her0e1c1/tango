import { Button } from "@/components/forms/Button";

export interface RemoteMutationNoticeProps {
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  showPending?: boolean;
  pendingLabel?: string;
  errorLabel?: string;
}

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
