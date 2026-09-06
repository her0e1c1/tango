import type { AccountPageStore } from "../types";
import { signInWithGoogle } from "../../api/signInWithGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(store: AccountPageStore, isMounted: () => boolean): Promise<void> {
  return runAccountAction(signInWithGoogle, store, isMounted, {
    operation: "signIn",
    success: "Signed in.",
    failure: "Unable to sign in.",
  });
}
