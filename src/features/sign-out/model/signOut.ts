import { signOut } from "firebase/auth";

import { auth } from "@/shared/firestore";

export const signOutCurrentUser = (): Promise<void> => signOut(auth);
