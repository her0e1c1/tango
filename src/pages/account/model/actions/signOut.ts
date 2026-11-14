import { matchPath } from "react-router-dom";

import { authSessionStore, getAuthUid, signOutCurrentUser } from "@/entities/auth";
import { getCurrentPathname, routes, subscribeRouterLocationChange } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

import { accountPageStore as store } from "../store";

let stopFailureTracking: (() => void) | undefined;

export async function signOut(): Promise<void> {
  if (store.getState().signOut.pending) return;
  stopFailureTracking?.();
  store.setState({ signOut: { pending: true } });
  const uid = getAuthUid();
  const scope = {
    sameVisit: matchPath(routes.account.path, getCurrentPathname() ?? "") !== null,
    sameIdentity: true,
  };
  const clearInline = () => {
    const hadInlineFailure = store.getState().signOut.failed === true;
    store.setState((state) => ({ signOut: { ...state.signOut, failed: false } }));
    if (hadInlineFailure) stopTracking();
  };
  const stopRoute = subscribeRouterLocationChange(() => {
    scope.sameVisit = false;
    clearInline();
  });
  const stopAuth = authSessionStore.subscribe((session) => {
    // A refused auth change temporarily hides Account but still belongs to this owner and visit.
    if (session.status === "initializing" || (session.status === "authenticated" && session.uid === uid)) return;
    scope.sameIdentity = false;
    clearInline();
  });
  const stopTracking = () => {
    stopRoute();
    stopAuth();
    if (stopFailureTracking === stopTracking) stopFailureTracking = undefined;
  };
  stopFailureTracking = stopTracking;
  try {
    await signOutCurrentUser();
    showToast({ messageKey: "account.toast.signOutSuccess", tone: "success", supplementary: true });
  } catch {
    // Do not resurrect an old owner's failure, or persist a Home notification on a later Account visit.
    if (!scope.sameIdentity) return;
    if (scope.sameVisit) {
      store.setState({ signOut: { pending: true, failed: true } });
    } else {
      showToast({ messageKey: "account.toast.signOutFailure", tone: "error", supplementary: true });
    }
  } finally {
    if (store.getState().signOut.failed !== true) stopTracking();
    store.setState((state) => ({ signOut: { ...state.signOut, pending: false } }));
  }
}
