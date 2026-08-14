import { type PropsWithChildren, useLayoutEffect, useMemo, useState } from "react";

import { useAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { startCardReads, stopCardReads } from "@/features/card/read";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { subscribeDecks } from "./deck";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  const subscriptionToken = useMemo(() => Symbol(uid ?? "signed-out"), [uid]);
  const [deckReadyToken, setDeckReadyToken] = useState<symbol>();

  useLayoutEffect(() => {
    if (uid == null) {
      clearCards();
      clearDecks();
      return;
    }
    let active = true;
    startCardReads(uid);
    const unsubscribeDecks = subscribeDecks(
      uid,
      () => {
        if (active) setDeckReadyToken(subscriptionToken);
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
  }, [subscriptionToken, uid]);

  if (uid != null && deckReadyToken !== subscriptionToken) return null;

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
