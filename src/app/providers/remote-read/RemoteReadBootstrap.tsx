import { useEffect, useState } from "react";

import { createAuthTransitionController } from "@/app/providers/auth/authTransitionController";
import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { useSession } from "@/entities/session";

export const RemoteReadBootstrap = () => {
  const session = useSession();
  const [controller] = useState(() =>
    createAuthTransitionController({
      cleanupUid: stopRemoteReads,
      subscribeUid: startRemoteReads,
      reportError: (error) => console.error("Remote read transition failed", error),
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
