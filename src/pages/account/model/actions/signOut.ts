import type { AccountActionControls } from "../types";
import { signOutCurrentUser } from "./signOutCurrentUser";
import { runAccountAction } from "./runAccountAction";

export function signOut(controls: AccountActionControls): Promise<void> {
  return runAccountAction(signOutCurrentUser, controls, { success: "Signed out.", failure: "Unable to sign out." });
}
