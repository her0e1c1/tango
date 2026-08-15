import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential, type User, type UserCredential } from "firebase/auth";

import { auth } from "@/shared/firebase";

export const loginGoogle = async (): Promise<User> => {
  const { currentUser } = auth;
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

  return result.user;
};
