import { teardownRemoteReadSession } from "@/app/providers/remote-read/remoteReadSessionLifecycle";
import { createStudySessionTeardown } from "@/features/study";

type SessionTeardownStep = "remoteRead" | "study";

export const createSessionTeardown = () => {
  const completed: Record<SessionTeardownStep, boolean> = { remoteRead: false, study: false };
  const teardownStudySession = createStudySessionTeardown();

  return async () => {
    const errors: unknown[] = [];
    const run = async (step: SessionTeardownStep, teardown: () => unknown | Promise<unknown>) => {
      if (completed[step]) return;
      try {
        await teardown();
        completed[step] = true;
      } catch (error) {
        errors.push(error);
      }
    };

    await run("remoteRead", teardownRemoteReadSession);
    await run("study", teardownStudySession);
    if (errors.length > 0) throw errors[0];
  };
};
