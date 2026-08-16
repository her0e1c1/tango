import React from "react";

import { useAuthUid } from "@/entities/auth";
import { clearRemoteCards, replaceRemoteCardsFromReads, subscribeCardReads } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";

const reportSubscriptionError = (error: Error): void => {
  // biome-ignore lint/suspicious/noConsole: Subscription failures need a last-resort runtime error sink.
  console.error(error);
};

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const uid = useAuthUid();

  React.useEffect(() => {
    if (uid === "") {
      return;
    }

    const stopCards = subscribeCardReads(uid, replaceRemoteCardsFromReads, reportSubscriptionError);
    const stopDecks = subscribeDecks(uid, reportSubscriptionError);

    return () => {
      stopCards();
      stopDecks();
      clearRemoteCards();
      clearRemoteDecks();
    };
  }, [uid]);

  return children;
};
