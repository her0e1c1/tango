import { showToast } from "@/shared/ui/toast";

import type { AccountPageState, AccountPageStore } from "../types";

interface AccountActionOptions {
  operation: keyof AccountPageState;
  success: string;
  failure: string;
}

export async function runAccountAction(
  action: () => Promise<unknown>,
  store: AccountPageStore,
  isMounted: () => boolean,
  { operation, success, failure }: AccountActionOptions
): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState()[operation].pending) return;
  // Change only this operation so an auth transition can expose the opposite action without sharing its lock.
  store.setState({ [operation]: { pending: true } });
  try {
    await action();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ message: success, tone: "success" });
  } catch {
    // This workflow handles failures, but late errors must not notify a Page the user has already left.
    if (isMounted()) {
      showToast({ message: failure, tone: "error" });
    }
  } finally {
    store.setState({ [operation]: { pending: false } });
  }
}
