import { getI18n } from "react-i18next";

import { signOutCurrentUser } from "../../api/signOutCurrentUser";
import { runAccountAction } from "./runAccountAction";

export function signOut(): Promise<void> {
  const i18n = getI18n();
  return runAccountAction(signOutCurrentUser, {
    operation: "signOut",
    success: i18n.t("account.toast.signOutSuccess"),
    failure: i18n.t("account.toast.signOutFailure"),
  });
}
