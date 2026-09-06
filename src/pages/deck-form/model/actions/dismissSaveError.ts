import type { RefObject } from "react";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

export const dismissSaveError = (toastId: RefObject<ToastId | undefined>): void => {
  if (toastId.current === undefined) return;
  dismissToast(toastId.current);
  toastId.current = undefined;
};
