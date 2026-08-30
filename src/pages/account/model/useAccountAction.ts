import { useEffect, useRef, useState } from "react";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissToast, showToast, type ToastId } from "@/shared/ui/toast";

interface AccountActionMessages {
  success: string;
  failure: string;
}

export const useAccountAction = (action: () => Promise<unknown>, messages: AccountActionMessages) => {
  const [pending, setPending] = useState(false);
  const isMounted = useMountedGuard();
  const errorToastId = useRef<ToastId | undefined>(undefined);

  const dismissErrorToast = () => {
    if (errorToastId.current === undefined) return;
    dismissToast(errorToastId.current);
    errorToastId.current = undefined;
  };

  const run = async (): Promise<void> => {
    dismissErrorToast();
    setPending(true);
    try {
      await action();
      // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
      showToast({ message: messages.success, tone: "success" });
    } catch (error) {
      if (isMounted()) {
        const toastId = showToast({
          message: messages.failure,
          tone: "error",
          action: {
            label: "Retry",
            onClick: () => {
              dismissToast(toastId);
              if (errorToastId.current === toastId) errorToastId.current = undefined;
              void run().catch(() => undefined);
            },
          },
        });
        errorToastId.current = toastId;
      }
      throw error;
    } finally {
      if (isMounted()) setPending(false);
    }
  };

  useEffect(
    () => () => {
      if (errorToastId.current !== undefined) dismissToast(errorToastId.current);
    },
    []
  );

  return { pending, run };
};
