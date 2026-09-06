import { showToast } from "@/shared/ui/toast";

import { signOutCurrentUser } from "../../api/signOutCurrentUser";
import { accountPageStore as store } from "../store";

export async function signOut(): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState().signOut.pending) return;
  // Change only this operation so an auth transition can expose the opposite action without sharing its lock.
  store.setState({ signOut: { pending: true } });
  try {
    await signOutCurrentUser();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ messageKey: "account.toast.signOutSuccess", tone: "success" });
  } catch {
    // Auth transitions can temporarily unmount the Account route, but a failed user action still owns its result notification.
    showToast({ messageKey: "account.toast.signOutFailure", tone: "error" });
  } finally {
    store.setState({ signOut: { pending: false } });
  }
}
