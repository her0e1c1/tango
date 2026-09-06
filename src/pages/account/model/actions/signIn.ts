import { getI18n } from "react-i18next";

import { signInWithGoogle } from "../../api/signInWithGoogle";
import { runAccountAction } from "./runAccountAction";

export function signIn(): Promise<void> {
  const i18n = getI18n();
  return runAccountAction(signInWithGoogle, {
    operation: "signIn",
    success: i18n.t("account.toast.signInSuccess"),
    failure: i18n.t("account.toast.signInFailure"),
  });
}
