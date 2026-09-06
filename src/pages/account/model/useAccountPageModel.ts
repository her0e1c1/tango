import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import { runAccountAction } from "./actions/runAccountAction";
import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { createAccountPageStore } from "./store";

const useAccountPageState = () => {
  // Scope pending work to this Page mount so late completions cannot update a newly mounted Page.
  const [store] = useState(createAccountPageStore);
  const pageState = useStore(store);
  const isMounted = useMountedGuard();
  return { pageState, store, isMounted };
};

export const useAccountPageModel = () => {
  const { t } = useTranslation();
  const auth = useAuth();
  const { pageState, store, isMounted } = useAccountPageState();

  return {
    auth,
    pageState,

    signIn: () =>
      void runAccountAction(signInAction, store, isMounted, {
        operation: "signIn",
        success: t("account.toast.signInSuccess"),
        failure: t("account.toast.signInFailure"),
      }),

    signOut: () =>
      void runAccountAction(signOutAction, store, isMounted, {
        operation: "signOut",
        success: t("account.toast.signOutSuccess"),
        failure: t("account.toast.signOutFailure"),
      }),
  };
};
