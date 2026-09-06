import { signInWithGoogle } from "../../api/signInWithGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(): Promise<void> {
  return runAccountAction(signInWithGoogle, {
    operation: "signIn",
    successKey: "account.toast.signInSuccess",
    failureKey: "account.toast.signInFailure",
  });
}
