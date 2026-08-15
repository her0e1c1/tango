import React from "react";

import { useAuthUid } from "@/entities/auth";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const uid = useAuthUid();

  React.useEffect(() => {
    if (uid === "") {
      return;
    }

    const stopCards = subscribeCards(uid, console.error);
    const stopDecks = subscribeDecks(uid, console.error);

    return () => {
      stopCards();
      stopDecks();
      clearRemoteCards();
      clearRemoteDecks();
    };
  }, [uid]);

  return children;
};
