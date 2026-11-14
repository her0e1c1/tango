import { matchPath } from "react-router-dom";

import { signOutCurrentUser } from "@/entities/auth";
import { getCurrentPathname, routes } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

import { accountPageStore as store } from "../store";

export async function signOut(): Promise<void> {
  // Acquire the synchronous store state before awaiting so duplicate actions cannot outrun React rendering.
  if (store.getState().signOut.pending) return;
  // Change only this operation so an auth transition can expose the opposite action without sharing its lock.
  store.setState({ signOut: { pending: true } });
  try {
    await signOutCurrentUser();
    // Auth transitions can temporarily unmount the Account route, but a completed user action still owns its result.
    showToast({ messageKey: "account.toast.signOutSuccess", tone: "success", supplementary: true });
  } catch {
    store.setState({ signOut: { pending: true, failed: true } });
    // Route presence, not component mount state, distinguishes an auth check from leaving Account.
    if (matchPath(routes.account.path, getCurrentPathname() ?? "") === null) {
      showToast({ messageKey: "account.toast.signOutFailure", tone: "error", supplementary: true });
    }
  } finally {
    store.setState((state) => ({ signOut: { ...state.signOut, pending: false } }));
  }
}
