import { signOut } from "firebase/auth";

import { auth } from "@/shared/api/firebase";

export const signOutCurrentUser = (): Promise<void> => signOut(auth);
