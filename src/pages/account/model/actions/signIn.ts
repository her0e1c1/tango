import type { TFunction } from "i18next";

import { signInWithGoogle } from "../../api/signInWithGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(t: TFunction): Promise<void> {
  return runAccountAction(signInWithGoogle, {
    operation: "signIn",
    success: t("account.toast.signInSuccess"),
    failure: t("account.toast.signInFailure"),
  });
}
