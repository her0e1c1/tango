import type { AccountPageStore } from "../types";
import { loginGoogle } from "./loginGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(store: AccountPageStore, isMounted: () => boolean): Promise<void> {
  return runAccountAction(loginGoogle, store, isMounted, {
    operation: "signIn",
    success: "Signed in.",
    failure: "Unable to sign in.",
  });
}
