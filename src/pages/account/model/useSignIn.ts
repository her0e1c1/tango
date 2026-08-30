import { loginGoogle } from "./signIn";
import { useAccountAction } from "./useAccountAction";

export const useSignIn = () => {
  const action = useAccountAction(loginGoogle);

  return { pending: action.pending, error: action.error, signIn: action.run };
};
