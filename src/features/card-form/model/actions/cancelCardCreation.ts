import type { RefObject } from "react";
import type { ToastId } from "@/shared/ui/toast";
import { dismissSaveError } from "./dismissSaveError";

export const cancelCardCreation = (
  pending: RefObject<boolean>,
  saveErrorToastId: RefObject<ToastId | undefined>,
  onCancel: () => void
): void => {
  // Keep the draft and retry identity alive until validation and persistence have both settled.
  if (pending.current) return;
  dismissSaveError(saveErrorToastId);
  onCancel();
};
