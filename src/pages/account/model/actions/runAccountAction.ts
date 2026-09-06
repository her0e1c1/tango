import type { RefObject } from "react";
import { showToast } from "@/shared/ui/toast";

export interface AccountActionState {
  pendingRef: RefObject<boolean>;
  setPending: (pending: boolean) => void;
  isMounted: () => boolean;
}

interface AccountActionMessages {
  success: string;
  failure: string;
}

export const runAccountAction = async (
  action: () => Promise<unknown>,
  { pendingRef, setPending, isMounted }: AccountActionState,
  messages: AccountActionMessages
): Promise<void> => {
  // Keep a synchronous lock because another same-tick action can run before React publishes pending state.
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
