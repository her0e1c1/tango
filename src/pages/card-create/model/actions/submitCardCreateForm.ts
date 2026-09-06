import type { BaseSyntheticEvent, RefObject } from "react";
import type { UseFormHandleSubmit } from "react-hook-form";

import type { CardCreateFormValues } from "../useCardCreateFormState";

export async function submitCardCreateForm(
  event: BaseSyntheticEvent | undefined,
  handleSubmit: UseFormHandleSubmit<CardCreateFormValues>,
  pending: RefObject<boolean>,
  onValid: (values: CardCreateFormValues) => Promise<void>
): Promise<void> {
  // RHF supplies presentation state; this lock closes the gap before validation resolves.
  if (pending.current) {
    event?.preventDefault();
    return;
  }
  pending.current = true;
  try {
    // Await the creation callback through RHF so both submission indicators cover the entire save.
    await handleSubmit(onValid)(event);
  } finally {
    pending.current = false;
  }
}
