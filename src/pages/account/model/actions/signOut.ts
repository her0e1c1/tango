import type { TFunction } from "i18next";

import { signOutCurrentUser } from "../../api/signOutCurrentUser";
import { runAccountAction } from "./runAccountAction";

export function signOut(t: TFunction): Promise<void> {
  return runAccountAction(signOutCurrentUser, {
    operation: "signOut",
    success: t("account.toast.signOutSuccess"),
    failure: t("account.toast.signOutFailure"),
  });
}
