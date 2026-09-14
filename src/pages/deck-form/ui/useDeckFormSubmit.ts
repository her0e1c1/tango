import { type RefObject, type SubmitEventHandler, useLayoutEffect, useRef } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";

import type { DeckFormFields } from "@/features/deck-form";

export function useDeckFormSubmit(
  handleSubmit: UseFormHandleSubmit<DeckFormFields>,
  onValid: (values: DeckFormFields) => Promise<void>
): SubmitEventHandler<HTMLFormElement> {
  const pending: RefObject<boolean> = useRef(false);
  const mounted: RefObject<boolean> = useRef(true);
  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return (event) => {
    event.preventDefault();
    // RHF validates asynchronously; reject repeated events before isSubmitting can rerender the UI.
    if (pending.current) return;
    pending.current = true;

    void handleSubmit(async (values) => {
      // A validator may finish after this form has been replaced by another editor.
      if (mounted.current) await onValid(values);
    })(event)
      .catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: Unexpected validation/navigation errors are not persistence failures.
        console.error("Deck edit form callback failed.", error);
      })
      .finally(() => {
        pending.current = false;
      });
  };
}
