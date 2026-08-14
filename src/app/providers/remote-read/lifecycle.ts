import { getAuthSession, subscribeAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { reconcileStudySessionsWithDecks } from "@/features/study";
import { startCardSynchronization } from "./card";
import { subscribeDecks } from "./deck";

const emptyCleanup = (): void => undefined;

export const startRemoteReadSession = (): (() => void) => {
  let currentUid: string | null | undefined;
  let cleanupCurrent = emptyCleanup;

  const transition = () => {
    const authSession = getAuthSession();
    const nextUid = authSession.status === "authenticated" ? authSession.uid : null;
    if (nextUid === currentUid) return;

    cleanupCurrent();
    cleanupCurrent = emptyCleanup;
    clearCards();
    clearDecks();
    currentUid = nextUid;

    if (nextUid == null) return;

    let active = true;
    let cancelStudyReconciliation = emptyCleanup;
    const stopCards = startCardSynchronization(nextUid);
    const stopDecks = subscribeDecks(
      nextUid,
      (decks) => {
        cancelStudyReconciliation();
        cancelStudyReconciliation = reconcileStudySessionsWithDecks(decks.map(({ id }) => id));
      },
      console.error,
      () => active
    );
    cleanupCurrent = () => {
      active = false;
      stopCards();
      stopDecks();
      cancelStudyReconciliation();
    };
  };

  const unsubscribeAuthSession = subscribeAuthSession(transition);
  transition();

  return () => {
    unsubscribeAuthSession();
    cleanupCurrent();
    cleanupCurrent = emptyCleanup;
    clearCards();
    clearDecks();
    currentUid = null;
  };
};
