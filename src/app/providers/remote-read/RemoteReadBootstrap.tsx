import { type PropsWithChildren, useEffect } from "react";

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { useAuthSession } from "@/entities/auth-session";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

export const RemoteReadBootstrap = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;

  useEffect(() => {
    if (uid == null) return;
    startRemoteReads(uid);
    return () => stopRemoteReads(uid);
  }, [uid]);

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
