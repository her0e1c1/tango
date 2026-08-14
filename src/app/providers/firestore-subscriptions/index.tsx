import React from "react";

import { useAuthSession } from "@/entities/auth";
import { clearCards, subscribeCards } from "@/entities/card";
import { clearDecks, subscribeDecks } from "@/entities/deck";
import { resetCardRead, setCardReadError, setCardReadLoading, setCardReadReady } from "@/features/card/read";

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authState = useAuthSession();
  const authenticatedUid = authState.status === "authenticated" ? authState.uid : null;

  React.useEffect(() => {
    if (authenticatedUid != null) setCardReadLoading(authenticatedUid);
    const stopCards =
      authenticatedUid == null
        ? undefined
        : subscribeCards(
            authenticatedUid,
            (error) => setCardReadError(authenticatedUid, error),
            (metadata) => setCardReadReady(authenticatedUid, !metadata.fromCache && !metadata.hasPendingWrites)
          );
    const stopDecks = authenticatedUid == null ? undefined : subscribeDecks(authenticatedUid, console.error);

    return () => {
      stopCards?.();
      stopDecks?.();
      resetCardRead(authenticatedUid ?? undefined);
      clearCards();
      clearDecks();
    };
  }, [authenticatedUid]);

  return children;
};
