import { signOut as firebaseSignOut } from "firebase/auth";

import { auth } from "@/shared/firebase";

export function signOut(): Promise<void> {
  return firebaseSignOut(auth);
}
