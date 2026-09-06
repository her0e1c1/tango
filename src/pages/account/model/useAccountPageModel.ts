import { useAuthSession } from "@/entities/auth";

import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { useAccountPageState } from "./useAccountPageState";

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
