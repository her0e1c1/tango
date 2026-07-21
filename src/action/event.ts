/**
 * @file Implements application-level Event operations.
 * The functions turn user intent into domain data or coordinated authentication work without
 * depending on React components.
 */

import { signOut, linkWithPopup, signInWithCredential, GoogleAuthProvider } from "firebase/auth";
import type { UserCredential } from "firebase/auth";
import { FirebaseError } from "firebase/app";

import { clearStudyStore, studyStore, type StudyState } from "@/features/study/state/studyStore";
import { publishAuthenticatedUser, suspendAnonymousBootstrap } from "@/auth/AuthContext";
import { auth } from "@/firebase";
import { remoteStore } from "@/store/remoteStore";

interface LogoutCleanupProgress {
  remote: boolean;
  study: boolean;
  studyStateAfterClear?: StudyState;
}

type LogoutCleanupStep = "remote" | "study";

/**
 * Represents the logout cleanup error condition used by the application.
 * The class keeps related error details or behavior together so callers can recognize and handle
 * this specific case.
 */
class LogoutCleanupError extends Error {
  constructor(
    readonly originalError: unknown,
    readonly retry: () => Promise<void>
  ) {
    super(originalError instanceof Error ? originalError.message : "Logout cleanup failed");
    this.name = "LogoutCleanupError";
  }
}

/**
 * Runs logout and local-data cleanup as a resumable sequence.
 * Completed cleanup steps are remembered so a retry does not repeat work that already succeeded.
 */
const runLogout = async (
  confirmedUid: string,
  progress: LogoutCleanupProgress,
  signOutRequired: boolean
): Promise<void> => {
  const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
  try {
    if (signOutRequired) await signOut(auth);

    const errors: unknown[] = [];
    /**
     * Runs one logout cleanup step unless that step already succeeded.
     * Failures are collected instead of stopping the next cleanup, allowing a retry to resume only
     * unfinished work.
     */
    const run = async (step: LogoutCleanupStep, cleanup: () => unknown | Promise<unknown>) => {
      if (progress[step]) return;
      try {
        await cleanup();
        progress[step] = true;
      } catch (error) {
        errors.push(error);
      }
    };

    await run("remote", () => remoteStore.getState().stop(confirmedUid));
    await run("study", async () => {
      if (progress.studyStateAfterClear && studyStore.getState() !== progress.studyStateAfterClear) return;
      const cleanup = clearStudyStore();
      progress.studyStateAfterClear = studyStore.getState();
      await cleanup;
    });
    if (errors.length > 0) {
      throw new LogoutCleanupError(errors[0], () => runLogout(confirmedUid, progress, false));
    }
  } finally {
    resumeAnonymousBootstrap();
  }
};

/**
 * Signs out the confirmed user and removes that user's remote and study state.
 * If local cleanup fails, the returned error carries a retry that resumes the unfinished steps.
 */
export const logout = (confirmedUid: string): Promise<void> =>
  runLogout(confirmedUid, { remote: false, study: false }, true);

/**
 * Upgrades the current anonymous Firebase user to a Google-authenticated account.
 * Existing credentials are recovered when Firebase reports that the Google account is already
 * linked elsewhere.
 */
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
