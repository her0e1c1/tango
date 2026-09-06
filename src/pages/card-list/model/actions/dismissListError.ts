import type { RefObject } from "react";
import { dismissToast, type ToastId } from "@/shared/ui/toast";

export const dismissListError = (errorToastId: RefObject<ToastId | undefined>): void => {
  if (errorToastId.current === undefined) return;
  dismissToast(errorToastId.current);
  errorToastId.current = undefined;
};
