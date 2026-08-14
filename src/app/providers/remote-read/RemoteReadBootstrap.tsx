import { type PropsWithChildren, useEffect } from "react";

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { useAuthSession } from "@/entities/auth-session";
import { DeckReadProvider } from "@/features/deck/read";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { deckRemoteReadStore } from "./deckReadStore";

export const RemoteReadBootstrap = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;

  useEffect(() => {
    if (uid == null) return;
    startRemoteReads(uid);
    return () => stopRemoteReads(uid);
  }, [uid]);

  return (
    <RemoteReadScopeProvider uid={uid}>
      <DeckReadProvider store={deckRemoteReadStore}>{children}</DeckReadProvider>
    </RemoteReadScopeProvider>
  );
};
