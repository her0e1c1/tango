import { showToast } from "@/shared/ui/toast";

import type { AccountPageState, AccountPageStore } from "../types";

interface AccountActionOptions {
  operation: keyof AccountPageState;
  successKey: string;
  failureKey: string;
}

export async function runAccountAction(
  action: () => Promise<unknown>,
  store: AccountPageStore,
  { operation, successKey, failureKey }: AccountActionOptions
): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState()[operation].pending) return;
  // Change only this operation so an auth transition can expose the opposite action without sharing its lock.
  store.setState({ [operation]: { pending: true } });
  try {
    await action();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ messageKey: successKey, tone: "success" });
  } catch {
    // Auth transitions can temporarily unmount the Account route, but a failed user action still owns its result notification.
    showToast({ messageKey: failureKey, tone: "error" });
  } finally {
    store.setState({ [operation]: { pending: false } });
  }
}
