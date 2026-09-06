import { signInWithGoogle } from "../../api/signInWithGoogle";

export function signIn(): Promise<unknown> {
  return signInWithGoogle();
}
