import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential } from "firebase/auth";

import { auth } from "@/shared/firebase";

export async function signIn(): Promise<void> {
  const { currentUser } = auth;
  if (!currentUser?.isAnonymous) throw new Error("Anonymous user is required before Google sign-in");

  try {
    await linkWithPopup(currentUser, new GoogleAuthProvider());
  } catch (error) {
    if (!(error instanceof FirebaseError)) throw error;

    const credential = GoogleAuthProvider.credentialFromError(error);
    if (credential == null) throw error;

    await signInWithCredential(auth, credential);
  }
}
