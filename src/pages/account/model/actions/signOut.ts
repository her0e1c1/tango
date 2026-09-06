import { signOutCurrentUser } from "../../api/signOutCurrentUser";
import { runAccountAction } from "./runAccountAction";

export function signOut(): Promise<void> {
  return runAccountAction(signOutCurrentUser, {
    operation: "signOut",
    successKey: "account.toast.signOutSuccess",
    failureKey: "account.toast.signOutFailure",
  });
}
