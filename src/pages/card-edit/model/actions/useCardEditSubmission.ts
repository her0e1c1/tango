import { useRef, type RefObject, type SubmitEventHandler } from "react";
import type { UseFormReturn } from "react-hook-form";

import type { CardContentInput } from "@/entities/card";

export function useCardEditSubmission(
  form: UseFormReturn<CardContentInput>,
  save: (values: CardContentInput) => Promise<void>
): SubmitEventHandler<HTMLFormElement> {
  const pending: RefObject<boolean> = useRef(false);
  const handleSubmit = form.handleSubmit(save);

  return (event) => {
    if (pending.current) {
      // RHF must not start duplicate validation that could outlive the first save.
      event.preventDefault();
      return;
    }

    pending.current = true;
    void handleSubmit(event)
      .catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: Unexpected validation/callback errors need a runtime sink, not a persistence-failure toast.
        console.error("Card edit form callback failed.", error);
      })
      .finally(() => {
        pending.current = false;
      });
  };
}
