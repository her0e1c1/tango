import { type PropsWithChildren, useEffect } from "react";

import { transitionRemoteReadSession } from "@/app/providers/remote-read/remoteReadSessionLifecycle";
import { useAuthSession } from "@/entities/auth-session";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

export const RemoteReadBootstrap = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();

  useEffect(() => {
    let cancelled = false;
    const transition = async () => {
      const succeeded = await transitionRemoteReadSession(authSession);
      if (!cancelled && succeeded === false) await transitionRemoteReadSession(authSession);
    };
    void transition();
    return () => {
      cancelled = true;
    };
  }, [authSession]);

  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
