import type { AccountActionControls } from "../types";
import { loginGoogle } from "./loginGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(controls: AccountActionControls): Promise<void> {
  return runAccountAction(loginGoogle, controls, { success: "Signed in.", failure: "Unable to sign in." });
}
