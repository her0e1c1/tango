import type { AuthSessionState } from "@/entities/auth-session";

import { startRemoteReads, stopRemoteReads } from "./remoteReadLifecycle";
import { createRemoteReadTransitionController } from "./remoteReadTransitionController";

type RemoteReadSessionLifecycleDependencies = {
  cleanupUid: (uid: string) => unknown | Promise<unknown>;
  subscribeUid: (uid: string) => unknown | Promise<unknown>;
  reportError: (error: unknown) => void;
};

export const createRemoteReadSessionLifecycle = (dependencies: RemoteReadSessionLifecycleDependencies) => {
  let latestError: unknown;
  const controller = createRemoteReadTransitionController({
    cleanupUid: dependencies.cleanupUid,
    subscribeUid: dependencies.subscribeUid,
    reportError: (error) => {
      latestError = error;
      dependencies.reportError(error);
    },
  });

  const transition = (state: AuthSessionState) => controller.transition(state);

  return {
    transition,
    teardown: async () => {
      const succeeded = await transition({ status: "signedOut" });
      if (!succeeded) {
        throw latestError instanceof Error ? latestError : new Error("Remote read teardown failed");
      }
    },
  };
};

const remoteReadSessionLifecycle = createRemoteReadSessionLifecycle({
  cleanupUid: stopRemoteReads,
  subscribeUid: startRemoteReads,
  reportError: (error) => console.error("Remote read transition failed", error),
});

export const transitionRemoteReadSession = (state: AuthSessionState) => remoteReadSessionLifecycle.transition(state);

export const teardownRemoteReadSession = (): Promise<void> => remoteReadSessionLifecycle.teardown();
