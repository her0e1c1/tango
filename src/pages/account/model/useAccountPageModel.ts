import { useAuthAccount, useAuthUid } from "@/entities/auth";

import { signIn as signInAction } from "./actions/signIn";
import { signOut as signOutAction } from "./actions/signOut";
import { useAccountPageState } from "./useAccountPageState";

export const useAccountPageModel = () => {
  const account = useAuthAccount();
  const uid = useAuthUid();
  const { pageState, store, isMounted } = useAccountPageState();

  return {
    account,
    uid,
    pageState,
    signIn: () => void signInAction(store, isMounted),
    signOut: () => void signOutAction(store, isMounted),
  };
};
