import { useRef, useState } from "react";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { showToast } from "@/shared/ui/toast";

interface AccountActionMessages {
  success: string;
  failure: string;
}

export const useAccountAction = (action: () => Promise<unknown>, messages: AccountActionMessages) => {
  const [pending, setPending] = useState(false);
  const isMounted = useMountedGuard();
  const pendingRef = useRef(false);

  const run = async (): Promise<void> => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: A second same-tick action can observe this ref before React rerenders.
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    try {
      await action();
      // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
      showToast({ message: messages.success, tone: "success" });
    } catch (error) {
      if (isMounted()) {
        showToast({ message: messages.failure, tone: "error" });
      }
      throw error;
    } finally {
      pendingRef.current = false;
      if (isMounted()) setPending(false);
    }
  };

  return { pending, run };
};
