import { signOutCurrentUser, suspendAnonymousBootstrap } from "@/features/auth";

import { createSessionTeardown } from "./sessionLifecycle";

class LogoutCleanupError extends Error {
  constructor(
    readonly originalError: unknown,
    readonly retry: () => Promise<void>
  ) {
    super(originalError instanceof Error ? originalError.message : "Logout cleanup failed");
    this.name = "LogoutCleanupError";
  }
}

const runLogout = async (teardownSession: () => Promise<void>, signOutRequired: boolean): Promise<void> => {
  const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
  try {
    if (signOutRequired) await signOutCurrentUser();
    try {
      await teardownSession();
    } catch (error) {
      throw new LogoutCleanupError(error, () => runLogout(teardownSession, false));
    }
  } finally {
    resumeAnonymousBootstrap();
  }
};

export const logout = (): Promise<void> => runLogout(createSessionTeardown(), true);
