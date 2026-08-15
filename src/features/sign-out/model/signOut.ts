import { signOut } from "firebase/auth";

import { auth } from "@/shared/api";

export const signOutCurrentUser = (): Promise<void> => signOut(auth);
