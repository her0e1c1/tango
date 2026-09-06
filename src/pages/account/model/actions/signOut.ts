import { signOutCurrentUser } from "./signOutCurrentUser";
import { runAccountAction, type AccountActionState } from "./runAccountAction";

export const signOut = (state: AccountActionState): Promise<void> =>
  runAccountAction(signOutCurrentUser, state, { success: "Signed out.", failure: "Unable to sign out." });
