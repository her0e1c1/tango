import { type PropsWithChildren, useEffect, useState } from "react";

import { useAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { startCardReads, stopCardReads } from "@/features/card/read";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { subscribeDecks } from "./deck";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  const [readReadyUid, setReadReadyUid] = useState<string | null>();

  useEffect(() => {
    if (uid == null) {
      clearCards();
      clearDecks();
      // Expose the signed-out scope only after stale entity data has been cleared.
      queueMicrotask(() => setReadReadyUid(null));
      return;
    }
    startCardReads(uid);
    const unsubscribeDecks = subscribeDecks(uid, () => setReadReadyUid(uid), console.error);
    return () => {
      stopCardReads(uid);
      unsubscribeDecks();
      clearCards();
      clearDecks();
    };
  }, [uid]);

  if (readReadyUid !== uid) return null;

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
