import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential, signOut, type UserCredential } from "firebase/auth";

import { publishAuthenticatedUser } from "./authController";
import { auth } from "@/shared/firebase";

export const loginGoogle = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser?.isAnonymous) throw new Error("Anonymous user is required before Google sign-in");

  let result: UserCredential;
  try {
    result = await linkWithPopup(currentUser, new GoogleAuthProvider());
  } catch (error) {
    if (!(error instanceof FirebaseError)) throw error;

    const credential = GoogleAuthProvider.credentialFromError(error);
    if (credential == null) throw error;

    result = await signInWithCredential(auth, credential);
  }

  publishAuthenticatedUser(result.user);
};

export const signOutCurrentUser = (): Promise<void> => signOut(auth);
