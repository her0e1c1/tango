import { type PropsWithChildren, useEffect, useState } from "react";

import { useAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { subscribeCards } from "./card";
import { subscribeDecks } from "./deck";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;
  const [deckReadyUid, setDeckReadyUid] = useState<string | null>(null);
  const [cardReadyUid, setCardReadyUid] = useState<string | null>(null);

  useEffect(() => {
    if (uid == null) {
      clearCards();
      clearDecks();
      return;
    }
    const unsubscribeCards = subscribeCards(uid, () => setCardReadyUid(uid), console.error);
    const unsubscribeDecks = subscribeDecks(uid, () => setDeckReadyUid(uid), console.error);
    return () => {
      unsubscribeCards();
      unsubscribeDecks();
      clearCards();
      clearDecks();
    };
  }, [uid]);

  if (uid != null && (cardReadyUid !== uid || deckReadyUid !== uid)) return null;

  return <>{children}</>;
};
