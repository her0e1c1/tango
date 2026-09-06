import { showToast } from "@/shared/ui/toast";

import { accountPageStore as store } from "../store";
import type { AccountPageState } from "../types";

interface AccountActionOptions {
  operation: keyof AccountPageState;
  success: string;
  failure: string;
}

export async function runAccountAction(
  action: () => Promise<unknown>,
  { operation, success, failure }: AccountActionOptions
): Promise<void> {
  const { mount } = store.getState();
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
    if (mount !== null && store.getState().mount === mount) {
      showToast({ message: failure, tone: "error" });
    }
  } finally {
    // A previous visit must not release the lock of an action started after remount.
    if (store.getState().mount === mount) {
      store.setState({ [operation]: { pending: false } });
    }
  }
}
