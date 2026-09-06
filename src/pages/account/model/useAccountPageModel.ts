import { useStore } from "zustand";

import { useAuthSession } from "@/entities/auth";

import { runAccountAction } from "./actions/runAccountAction";
import { accountPageStore } from "./store";
import { useAccountPageLifecycle } from "./useAccountPageLifecycle";

const useAccountPageState = () => useStore(accountPageStore, (state) => state.pageState);

export const useAccountPageModel = () => {
  useAccountPageLifecycle();
  const authSession = useAuthSession();
  const pageState = useAccountPageState();

  return {
    authSession,
    pageState,
    signIn: () => void runAccountAction("signIn"),
    signOut: () => void runAccountAction("signOut"),
  };
};
