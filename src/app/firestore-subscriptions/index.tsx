import React from "react";

import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { useCurrentUser } from "@/entities/user";

const reportSubscriptionError = (error: Error): void => {
  // biome-ignore lint/suspicious/noConsole: Subscription failures need a last-resort runtime error sink.
  console.error(error);
};

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const uid = useCurrentUser()?.uid ?? "";

  React.useEffect(() => {
    if (uid === "") {
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
