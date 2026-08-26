import React from "react";

import { useGoogleAccountUid } from "@/entities/auth";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";

const reportSubscriptionError = (error: Error): void => {
  // biome-ignore lint/suspicious/noConsole: Subscription failures need a last-resort runtime error sink.
  console.error(error);
};

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const uid = useGoogleAccountUid();

  React.useEffect(() => {
    if (uid === "") {
      clearRemoteCards();
      clearRemoteDecks();
      return;
    }

    const stopCards = subscribeCards(uid, reportSubscriptionError);
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
