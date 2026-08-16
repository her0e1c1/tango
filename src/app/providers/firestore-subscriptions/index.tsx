import React from "react";

import { useAuthUid } from "@/entities/auth";
import type { CardRead } from "@/entities/card";
import { clearRemoteCards, replaceRemoteCardsFromReads, subscribeCardReads } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { clearRemoteStudyProgresses, replaceRemoteStudyProgresses } from "@/entities/study-progress";

const reportSubscriptionError = (error: Error): void => {
  // biome-ignore lint/suspicious/noConsole: Subscription failures need a last-resort runtime error sink.
  console.error(error);
};

const publishCardReads = (reads: CardRead[]): void => {
  replaceRemoteCardsFromReads(reads);
  replaceRemoteStudyProgresses(reads.map(({ progress }) => progress));
};

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const uid = useAuthUid();

  React.useEffect(() => {
    if (uid === "") {
      return;
    }

    const stopCards = subscribeCardReads(uid, publishCardReads, reportSubscriptionError);
    const stopDecks = subscribeDecks(uid, reportSubscriptionError);

    return () => {
      stopCards();
      stopDecks();
      clearRemoteCards();
      clearRemoteStudyProgresses();
      clearRemoteDecks();
    };
  }, [uid]);

  return children;
};
