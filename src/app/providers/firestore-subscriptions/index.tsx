import React from "react";

import { useAuthSession } from "@/entities/auth";
import { clearCards, subscribeCards } from "@/entities/card";
import { clearDecks, subscribeDecks } from "@/entities/deck";

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authState = useAuthSession();
  const authenticatedUid = authState.status === "authenticated" ? authState.uid : null;

  React.useEffect(() => {
    const stopCards = authenticatedUid == null ? undefined : subscribeCards(authenticatedUid, console.error);
    const stopDecks = authenticatedUid == null ? undefined : subscribeDecks(authenticatedUid, console.error);

    return () => {
      stopCards?.();
      stopDecks?.();
      clearCards();
      clearDecks();
    };
  }, [authenticatedUid]);

  return children;
};
