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
    clearCards();
    clearDecks();
    if (uid == null) {
      // The signed-out scope becomes renderable only after its entity stores are empty.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReadReadyUid(null);
      return;
    }
    let active = true;
    startCardReads(uid);
    const unsubscribeDecks = subscribeDecks(
      uid,
      () => {
        if (active) setReadReadyUid(uid);
      },
      console.error
    );
    return () => {
      active = false;
      stopCardReads(uid);
      unsubscribeDecks();
      clearCards();
      clearDecks();
    };
  }, [uid]);

  if (readReadyUid !== uid) return null;

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
