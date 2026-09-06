import { loginGoogle } from "./loginGoogle";
import { runAccountAction, type AccountActionState } from "./runAccountAction";

export const signIn = (state: AccountActionState): Promise<void> =>
  runAccountAction(loginGoogle, state, { success: "Signed in.", failure: "Unable to sign in." });
