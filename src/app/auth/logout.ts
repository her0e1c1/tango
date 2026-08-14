import { suspendAnonymousBootstrap } from "@/app/providers/auth";
import { signOutCurrentUser } from "@/features/auth/sign-out";
import { clearStudyStore } from "@/features/study";

export const logout = async (): Promise<void> => {
  const resumeAnonymousBootstrap = suspendAnonymousBootstrap();
  try {
    await signOutCurrentUser();
    await clearStudyStore();
  } finally {
    resumeAnonymousBootstrap();
  }
};
