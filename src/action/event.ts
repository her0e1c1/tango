import { signOut, linkWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import type { UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { clearStudyStore } from "@/features/study/state/studyStore";
import { publishAuthenticatedUser, suspendAnonymousBootstrap } from "@/auth/AuthContext";
import { auth } from "@/firebase";
import { cleanupFirestoreUid } from "@/query/cleanup";

interface LogoutCleanupProgress {
  query: boolean;
  study: boolean;
}

class LogoutCleanupError extends Error {
  constructor(
    readonly originalError: unknown,
    readonly retry: () => Promise<void>
  ) {
    super(originalError instanceof Error ? originalError.message : "Logout cleanup failed");
    this.name = "LogoutCleanupError";
  }
}

const runLogout = async (
  confirmedUid: string,
  progress: LogoutCleanupProgress,
  signOutRequired: boolean
): Promise<void> => {
  const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
  try {
    if (signOutRequired) await signOut(auth);

    const errors: unknown[] = [];
    const run = async (step: keyof LogoutCleanupProgress, cleanup: () => unknown | Promise<unknown>) => {
      if (progress[step]) return;
      try {
        await cleanup();
        progress[step] = true;
      } catch (error) {
        errors.push(error);
      }
    };

    await run("query", () => cleanupFirestoreUid(confirmedUid));
    await run("study", clearStudyStore);
    if (errors.length > 0) {
      throw new LogoutCleanupError(errors[0], () => runLogout(confirmedUid, progress, false));
    }
  } finally {
    resumeAnonymousBootstrap();
  }
};

export const logout = (confirmedUid: string): Promise<void> =>
  runLogout(confirmedUid, { query: false, study: false }, true);

export const loginGoogle = async (): Promise<void> => {
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
