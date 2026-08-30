import { signOutCurrentUser } from "./signOut";
import { useAccountAction } from "./useAccountAction";

export const useSignOut = () => {
  const action = useAccountAction(signOutCurrentUser, { success: "Signed out.", failure: "Unable to sign out." });

  return { pending: action.pending, signOut: action.run };
};
