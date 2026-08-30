import { loginGoogle } from "./signIn";
import { useAccountAction } from "./useAccountAction";

export const useSignIn = () => {
  const action = useAccountAction(loginGoogle, { success: "Signed in.", failure: "Unable to sign in." });

  return { pending: action.pending, signIn: action.run };
};
