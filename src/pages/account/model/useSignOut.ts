import { signOutCurrentUser } from "./signOut";
import { useAccountAction } from "./useAccountAction";

export const useSignOut = () => {
  const action = useAccountAction(signOutCurrentUser);

  return { pending: action.pending, error: action.error, signOut: action.run };
};
