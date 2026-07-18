import { Button } from "@/components/forms/Button";

export const RemoteMutationNotice = (props: { pending: boolean; error: unknown; onRetry: () => void }) => {
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
  return props.pending ? (
    <div role="status" className="my-2 text-sm text-gray-500">
      Saving…
    </div>
  ) : null;
};
