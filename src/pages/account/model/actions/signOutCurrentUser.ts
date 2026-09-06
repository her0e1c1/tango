import { signOut } from "firebase/auth";

import { auth } from "@/shared/firebase";

export const signOutCurrentUser = (): Promise<void> => signOut(auth);
