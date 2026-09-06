import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";

import { runAccountAction } from "./actions/runAccountAction";
import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { createAccountPageStore } from "./store";

const useAccountPageState = () => {
  // Scope pending work to this Page mount so late completions cannot update a newly mounted Page.
  const [store] = useState(createAccountPageStore);
  const pageState = useStore(store);
  return { pageState, store };
};

export const useAccountPageModel = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const { pageState, store } = useAccountPageState();

  return {
    auth,
    pageState,

    signIn: () =>
      void runAccountAction(signInAction, store, {
        operation: "signIn",
        success: t("account.toast.signInSuccess"),
        failure: t("account.toast.signInFailure"),
      }),

    signOut: () =>
      void runAccountAction(signOutAction, store, {
        operation: "signOut",
        success: t("account.toast.signOutSuccess"),
        failure: t("account.toast.signOutFailure"),
      }),
  };
};
