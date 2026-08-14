import { getAuthSession, subscribeAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { startCardSynchronization } from "./card";
import { subscribeDecks } from "./deck";

const noCleanup = (): void => undefined;

export const startRemoteReadSessionLifecycle = (): (() => void) => {
  let currentUid: string | null | undefined;
  let stopCurrentSession = noCleanup;

  const transition = (session: ReturnType<typeof getAuthSession>) => {
    const nextUid = session.status === "authenticated" ? session.uid : null;
    if (nextUid === currentUid) return;
    currentUid = nextUid;

    stopCurrentSession();
    stopCurrentSession = noCleanup;
    clearCards();
    clearDecks();

    if (nextUid == null) return;

    const stopCards = startCardSynchronization(nextUid);
    const stopDecks = subscribeDecks(nextUid, console.error);
    stopCurrentSession = () => {
      stopCards();
      stopDecks();
    };
  };

  const unsubscribeAuthSession = subscribeAuthSession(transition);
  transition(getAuthSession());

  return () => {
    unsubscribeAuthSession();
    stopCurrentSession();
    clearCards();
    clearDecks();
  };
};
