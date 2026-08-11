import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, linkWithPopup, signInWithCredential, type UserCredential } from "firebase/auth";

import { publishAuthenticatedUser } from "@/features/auth/model/authController";
import { auth } from "@/shared/firebase";

export const loginGoogle = async (): Promise<void> => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("must sign in anonymously in advance");
    return;
  }

  let result: UserCredential | null = null;
  try {
    result = await linkWithPopup(currentUser, new GoogleAuthProvider());
  } catch (error) {
    if (error instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(error);
      if (credential) result = await signInWithCredential(auth, credential);
    }
  }

  if (!result) throw new Error("failed to login");
  process.env.NODE_ENV !== "production" && console.log("LOGIN GOOGLE", result);
  publishAuthenticatedUser(result.user);
};
