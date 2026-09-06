import { useAuth } from "@/entities/auth";

import { signIn } from "./actions/signIn";
import { signOut } from "./actions/signOut";
import { useAccountPageState } from "./useAccountPageState";

export const useAccountPageModel = () => {
  const auth = useAuth();
  const pageState = useAccountPageState();

  return { auth, pageState, signIn: () => void signIn(), signOut: () => void signOut() };
};
