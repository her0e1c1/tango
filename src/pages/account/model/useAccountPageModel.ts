import { useState } from "react";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";
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
  const auth = useAuth();
  const { pageState, store, isMounted } = useAccountPageState();

  return {
    auth,
    pageState,
    signIn: () => void signInAction(store, isMounted),
    signOut: () => void signOutAction(store, isMounted),
  };
};
