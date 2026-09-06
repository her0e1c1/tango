import type { AccountPageStore } from "../types";
import { signOutCurrentUser } from "./signOutCurrentUser";
import { runAccountAction } from "./runAccountAction";

export function signOut(store: AccountPageStore, isMounted: () => boolean): Promise<void> {
  return runAccountAction(signOutCurrentUser, store, isMounted, {
    operation: "signOut",
    success: "Signed out.",
    failure: "Unable to sign out.",
  });
}
