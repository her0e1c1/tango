import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";

import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { accountPageStore } from "./store";

export const useAccountPageModel = () => {
  const auth = useAuth();
  const pageState = useStore(accountPageStore);

  return {
    auth,
    pageState,
    signIn: () => void signInAction(),
    signOut: () => void signOutAction(),
  };
};
