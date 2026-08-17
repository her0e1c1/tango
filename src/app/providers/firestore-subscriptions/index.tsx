import React from "react";

import { useAuthUid } from "@/entities/auth";
import { clearRemoteCards, replaceRemoteCards, subscribeCardReads } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { clearRemoteStudyProgresses, replaceRemoteStudyProgresses } from "@/entities/study-progress";

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

    const stopCards = subscribeCardReads(
      uid,
      (reads) => {
        // Both stores must observe the same validated physical snapshot even though their models stay separated.
        replaceRemoteCards(reads.map(({ card }) => card));
        replaceRemoteStudyProgresses(reads.map(({ progress }) => progress));
      },
      reportSubscriptionError
    );
    const stopDecks = subscribeDecks(uid, reportSubscriptionError);

    return () => {
      stopCards();
      stopDecks();
      clearRemoteCards();
      clearRemoteDecks();
      clearRemoteStudyProgresses();
    };
  }, [uid]);

  return children;
};
