import { useEffect, useState } from "react";

import { createAuthTransitionController } from "@/app/providers/auth/authTransitionController";
import { useSession } from "@/entities/session";
import { remoteStore } from "@/store/remoteStore";

export const AuthBootstrap = () => {
  const session = useSession();
  const [controller] = useState(() =>
    createAuthTransitionController({
      cleanupUid: (uid) => remoteStore.getState().stop(uid),
      subscribeUid: (uid) => remoteStore.getState().start(uid),
      reportError: (error) => console.error("Auth transition failed", error),
    })
  );

  useEffect(() => {
    let cancelled = false;
    const transition = async () => {
      const succeeded = await controller.transition(session);
      if (!cancelled && succeeded === false) await controller.transition(session);
    };
    void transition();
    return () => {
      cancelled = true;
    };
  }, [controller, session]);

  return null;
};
