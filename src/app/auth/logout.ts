import { stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { suspendAnonymousBootstrap } from "@/app/providers/auth";
import { signOutCurrentUser } from "@/features/auth/sign-out";
import { clearStudyStore } from "@/features/study";

export const logout = async (confirmedUid: string): Promise<void> => {
  const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
  try {
    await signOutCurrentUser();
    await Promise.all([
      Promise.resolve().then(() => stopRemoteReads(confirmedUid)),
      Promise.resolve().then(() => clearStudyStore()),
    ]);
  } finally {
    resumeAnonymousBootstrap();
  }
};
