import { useState } from "react";
import { useStore } from "zustand";

import { useAuthSession } from "@/entities/auth";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

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
  const authSession = useAuthSession();
  const { pageState, store, isMounted } = useAccountPageState();

  return {
    authSession,
    pageState,
    signIn: () => void signInAction(store, isMounted),
    signOut: () => void signOutAction(store, isMounted),
  };
};
