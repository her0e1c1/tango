import { signOutCurrentUser } from "../../api/signOutCurrentUser";

export function signOut(): Promise<unknown> {
  return signOutCurrentUser();
}
