import { showToast } from "@/shared/ui/toast";

import { accountPageStore } from "../store";
import type { AccountOperation } from "../types";
import { signIn } from "./signIn";
import { signOut } from "./signOut";

const messages = {
  signIn: { success: "Signed in.", failure: "Unable to sign in." },
  signOut: { success: "Signed out.", failure: "Unable to sign out." },
};

export async function runAccountAction(operation: AccountOperation): Promise<void> {
  const { ownerId, pageState } = accountPageStore.getState();
  // Acquire the lock synchronously so repeated clicks cannot outrun React rendering.
  if (ownerId === null || pageState[operation].pending) return;
  accountPageStore.setState((state) => ({
    pageState: { ...state.pageState, [operation]: { pending: true } },
  }));

  try {
    const action = operation === "signIn" ? signIn : signOut;
    await action();
    // Auth transitions can unmount the route, but a completed user action still owns its success feedback.
    showToast({ message: messages[operation].success, tone: "success" });
  } catch {
    // A remounted page is a different owner; it must not receive an earlier page's delayed failure.
    if (accountPageStore.getState().ownerId === ownerId) {
      showToast({ message: messages[operation].failure, tone: "error" });
    }
  } finally {
    // Preserve both a newer owner's pending work and the opposite operation's independent lock.
    accountPageStore.setState((state) =>
      state.ownerId === ownerId ? { pageState: { ...state.pageState, [operation]: { pending: false } } } : state
    );
  }
}
