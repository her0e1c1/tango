import React from "react";

import { useAuthSession } from "@/entities/auth";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authState = useAuthSession();
  const authenticatedUid = authState.status === "authenticated" ? authState.uid : null;

  React.useEffect(() => {
    if (authenticatedUid === null) {
      return;
    }

    const stopCards = subscribeCards(authenticatedUid, console.error);
    const stopDecks = subscribeDecks(authenticatedUid, console.error);

    return () => {
      stopCards();
      stopDecks();
      clearRemoteCards();
      clearRemoteDecks();
    };
  }, [authenticatedUid]);

  return children;
};
