import { subscribeCardStudyStates, clearCardStudyStates } from "@/entities/card-study-state";
import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { clearStudySessions, subscribeStudySessions } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";

export function startFirestoreSubscriptions(uid: string): { ready: Promise<void>; stop: () => void } {
  let active = true;
  const readiness = Promise.withResolvers<void>();
  const onError = (error: Error) => {
    readiness.reject(error);
    if (active) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
  };
  const pending = new Set(["cards", "decks", "sessions", "states"]);
  const loaded = (name: string) => {
    pending.delete(name);
    if (pending.size === 0) readiness.resolve();
  };
  const stops = [
    subscribeCardStudyStates(uid, onError, () => loaded("states")),
    subscribeCards(uid, onError, () => loaded("cards")),
    subscribeDecks(uid, onError, () => loaded("decks")),
    subscribeStudySessions(uid, onError, () => loaded("sessions")),
  ];
  return {
    ready: readiness.promise,
    stop: () => {
      active = false;
      for (const stop of stops) stop();
      clearCardStudyStates();
      clearRemoteCards();
      clearRemoteDecks();
      clearStudySessions();
    },
  };
}
