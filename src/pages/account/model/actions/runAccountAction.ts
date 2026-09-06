import { showToast } from "@/shared/ui/toast";

import type { AccountActionControls } from "../types";

interface AccountActionMessages {
  success: string;
  failure: string;
}

export async function runAccountAction(
  action: () => Promise<unknown>,
  { store, isMounted }: AccountActionControls,
  messages: AccountActionMessages
): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState().pending) return;
  store.setState({ pending: true });
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
    store.setState({ pending: false });
  }
}
