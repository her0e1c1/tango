import { getAuthSession, subscribeAuthSession } from "@/entities/auth";
import { clearCards } from "@/entities/card";
import { clearDecks } from "@/entities/deck";
import { startCardSynchronization } from "./card";
import { subscribeDecks } from "./deck";

export const startRemoteReadSessionLifecycle = (): (() => void) => {
  let currentUid: string | null | undefined;
  let stopCurrentSession: (() => void) | undefined;

  const transition = (session: ReturnType<typeof getAuthSession>) => {
    const nextUid = session.status === "authenticated" ? session.uid : null;
    if (nextUid === currentUid) return;
    currentUid = nextUid;

    stopCurrentSession?.();
    stopCurrentSession = undefined;
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
    stopCurrentSession?.();
    clearCards();
    clearDecks();
  };
};
