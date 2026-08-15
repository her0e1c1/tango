import React from "react";

import { useAuthSession } from "@/entities/auth";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { clearRemoteStudyProgresses, subscribeStudyProgresses } from "@/entities/study-progress";

export const FirestoreSubscriptionsProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const authState = useAuthSession();
  const authenticatedUid = authState.status === "authenticated" ? authState.uid : null;

  React.useEffect(() => {
    const stopCards = authenticatedUid == null ? undefined : subscribeCards(authenticatedUid, console.error);
    const stopDecks = authenticatedUid == null ? undefined : subscribeDecks(authenticatedUid, console.error);
    const stopStudyProgresses =
      authenticatedUid == null ? undefined : subscribeStudyProgresses(authenticatedUid, console.error);

    return () => {
      stopCards?.();
      stopDecks?.();
      stopStudyProgresses?.();
      clearRemoteCards();
      clearRemoteDecks();
      clearRemoteStudyProgresses();
    };
  }, [authenticatedUid]);

  return children;
};
