import { type PropsWithChildren, useEffect, useState } from "react";

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { createRemoteReadTransitionController } from "@/app/providers/remote-read/remoteReadTransitionController";
import { useAuthSession } from "@/entities/auth-session";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

export const RemoteReadBootstrap = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const [controller] = useState(() =>
    createRemoteReadTransitionController({
      cleanupUid: stopRemoteReads,
      subscribeUid: startRemoteReads,
      reportError: (error) => console.error("Remote read transition failed", error),
    })
  );

  useEffect(() => {
    let cancelled = false;
    const transition = async () => {
      const succeeded = await controller.transition(authSession);
      if (!cancelled && succeeded === false) await controller.transition(authSession);
    };
    void transition();
    return () => {
      cancelled = true;
    };
  }, [controller, authSession]);

  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
