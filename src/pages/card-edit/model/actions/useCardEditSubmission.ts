import { useRef, type RefObject, type SubmitEvent } from "react";

export function useCardEditSubmission(handleSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>) {
  const pending: RefObject<boolean> = useRef(false);

  return async (event: SubmitEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (pending.current) return;

    // Lock before validation; isSubmitting only disables controls after React renders.
    pending.current = true;
    try {
      await handleSubmit(event);
    } finally {
      pending.current = false;
    }
  };
}
