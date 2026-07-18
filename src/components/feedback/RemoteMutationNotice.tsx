import { Button } from "@/components/forms/Button";

interface RemoteMutationNoticeProps {
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  showPending?: boolean;
}

export const RemoteMutationNotice = (props: RemoteMutationNoticeProps) => {
  if (props.error != null) {
    return (
      <div role="alert" className="my-2 flex items-center justify-between rounded border border-red-300 p-2 text-sm">
        <span>Unable to save changes.</span>
        <Button small onClick={props.onRetry}>
          Retry
        </Button>
      </div>
    );
  }
  if (!props.pending || props.showPending === false) return null;
  return (
    <div role="status" className="my-2 text-sm text-gray-500">
      Saving…
    </div>
  );
};
