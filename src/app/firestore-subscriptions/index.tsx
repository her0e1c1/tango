import React from "react";

import { useAuthSession } from "@/entities/auth";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { setStudySessionOwner, subscribeStudySessions } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";

const reportSubscriptionError = (error: Error): void => {
  // biome-ignore lint/suspicious/noConsole: Subscription failures need a last-resort runtime error sink.
  console.error(error);
};

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const session = useAuthSession();
  const uid = session.status === "authenticated" && !session.isAnonymous ? session.uid : "";

  React.useEffect(() => {
    if (uid === "") {
      setStudySessionOwner(undefined);
      return;
    }

    const stopCards = subscribeCards(uid, reportSubscriptionError);
    const stopDecks = subscribeDecks(uid, reportSubscriptionError);
    const stopStudySessions = subscribeStudySessions(uid, () => {
      showToast({ messageKey: "studySession.syncFailure", tone: "error" });
    });

    return () => {
      stopCards();
      stopDecks();
      stopStudySessions();
      clearRemoteCards();
      clearRemoteDecks();
    };
  }, [uid]);

  return children;
};
