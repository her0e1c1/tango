import { signOut, linkWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import type { UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import type { ThunkResult } from "@/action/index";
import { clearStudyStore } from "@/features/study/state/studyStore";
import { publishAuthenticatedUser, suspendAnonymousBootstrap } from "@/auth/AuthContext";
import { auth } from "@/firebase";
import { cleanupFirestoreUid } from "@/query/cleanup";

export const logout =
  (confirmedUid: string): ThunkResult =>
  async () => {
    const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
    try {
      await signOut(auth);
      const errors: unknown[] = [];
      const run = async (step: () => unknown | Promise<unknown>) => {
        try {
          await step();
        } catch (error) {
          errors.push(error);
        }
      };

      await run(() => cleanupFirestoreUid(confirmedUid));
      await run(clearStudyStore);
      if (errors.length > 0) {
        throw errors[0];
      }
    } finally {
      resumeAnonymousBootstrap();
    }
  };

export const loginGoogle = (): ThunkResult => async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    console.error("must sign in anonymously in advance");
    return;
  }
  let result: UserCredential | null = null;
  try {
    result = await linkWithPopup(currentUser, new GoogleAuthProvider());
  } catch (e) {
    if (e instanceof FirebaseError) {
      const credential = GoogleAuthProvider.credentialFromError(e);
      if (credential) {
        result = await signInWithCredential(auth, credential);
      }
    }
  }
  if (!result) {
    throw Error("failed to login");
  }
  process.env.NODE_ENV !== "production" && console.log("LOGIN GOOGLE", result);
  publishAuthenticatedUser(result.user);
};
