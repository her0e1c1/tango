import { showToast } from "@/shared/ui/toast";

import { signInWithGoogle } from "../../api/signInWithGoogle";
import { accountPageStore as store } from "../store";

export async function signIn(): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState().signIn.pending) return;
  // Change only this operation so an auth transition can expose the opposite action without sharing its lock.
  store.setState({ signIn: { pending: true } });
  try {
    await signInWithGoogle();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ messageKey: "account.toast.signInSuccess", tone: "success" });
  } catch {
    // Auth transitions can temporarily unmount the Account route, but a failed user action still owns its result notification.
    showToast({ messageKey: "account.toast.signInFailure", tone: "error" });
  } finally {
    store.setState({ signIn: { pending: false } });
  }
}
