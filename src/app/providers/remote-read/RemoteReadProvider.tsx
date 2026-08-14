import { type PropsWithChildren, useEffect, useState } from "react";

import { useAuthSession } from "@/entities/auth-session";
import { clearDecks } from "@/entities/deck";
import { startCardReads, stopCardReads } from "@/features/card/read";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { subscribeDecks } from "./deck";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  const [deckReadyUid, setDeckReadyUid] = useState<string | null>(null);

  useEffect(() => {
    if (uid == null) {
      clearDecks();
      return;
    }
    startCardReads(uid);
    const unsubscribeDecks = subscribeDecks(uid, () => setDeckReadyUid(uid), console.error);
    return () => {
      stopCardReads(uid);
      unsubscribeDecks();
      clearDecks();
    };
  }, [uid]);

  if (uid != null && deckReadyUid !== uid) return null;

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
