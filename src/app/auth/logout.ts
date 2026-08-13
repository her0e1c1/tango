import { stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { signOutCurrentUser, suspendAnonymousBootstrap } from "@/features/auth";
import { createStudyIdentityCleanup, type StudyIdentityCleanup } from "@/features/study";

interface LogoutCleanupProgress {
  remote: boolean;
  study: boolean;
  studyCleanup: StudyIdentityCleanup;
}

type LogoutCleanupStep = "remote" | "study";

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
    if (signOutRequired) await signOutCurrentUser();

    const errors: unknown[] = [];
    const run = async (step: LogoutCleanupStep, cleanup: () => unknown | Promise<unknown>) => {
      if (progress[step]) return;
      try {
        await cleanup();
        progress[step] = true;
      } catch (error) {
        errors.push(error);
      }
    };

    await run("remote", () => stopRemoteReads(confirmedUid));
    await run("study", progress.studyCleanup);
    if (errors.length > 0) {
      throw new LogoutCleanupError(errors[0], () => runLogout(confirmedUid, progress, false));
    }
  } finally {
    resumeAnonymousBootstrap();
  }
};

export const logout = (confirmedUid: string): Promise<void> =>
  runLogout(confirmedUid, { remote: false, study: false, studyCleanup: createStudyIdentityCleanup() }, true);
