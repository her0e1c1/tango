import { showToast } from "@/shared/ui/toast";

import type { AccountActionControls } from "../types";

interface AccountActionMessages {
  success: string;
  failure: string;
}

export async function runAccountAction(
  action: () => Promise<unknown>,
  { pendingRef, setPending, isMounted }: AccountActionControls,
  messages: AccountActionMessages
): Promise<void> {
  // Keep a synchronous lock because another same-tick action can run before React publishes pending state.
  if (pendingRef.current) return;
  pendingRef.current = true;
  setPending(true);
  try {
    await action();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ message: messages.success, tone: "success" });
  } catch {
    // This workflow owns failure feedback so callers do not need to handle the same error again.
    if (isMounted()) {
      showToast({ message: messages.failure, tone: "error" });
    }
  } finally {
    pendingRef.current = false;
    if (isMounted()) setPending(false);
  }
}
