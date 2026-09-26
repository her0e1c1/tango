import { clearRemoteCards, subscribeCards } from "@/entities/card";
import { clearRemoteDecks, subscribeDecks } from "@/entities/deck";
import { clearStudySessions, subscribeStudySessions } from "@/entities/study-session";
import { showToast } from "@/shared/ui/toast";

export function startFirestoreSubscriptions(uid: string): { ready: Promise<void>; stop: () => void } {
  let active = true;
  const readiness = Promise.withResolvers<void>();
  const pending = new Set(["cards", "decks", "sessions"]);
  const onError = (name: string, error: Error) => {
    // A usable cached result can survive a later sync error while other stores load.
    if (pending.has(name)) readiness.reject(error);
    if (active) showToast({ messageKey: "studySession.syncFailure", tone: "error" });
  };
  const loaded = (name: string) => {
    pending.delete(name);
    if (pending.size === 0) readiness.resolve();
  };
  const stops = [
    subscribeCards(
      uid,
      (error) => onError("cards", error),
      () => loaded("cards")
    ),
    subscribeDecks(
      uid,
      (error) => onError("decks", error),
      () => loaded("decks")
    ),
    subscribeStudySessions(
      uid,
      (error) => onError("sessions", error),
      () => loaded("sessions")
    ),
  ];
  return {
    ready: readiness.promise,
    stop: () => {
      active = false;
      for (const stop of stops) stop();
      clearRemoteCards();
      clearRemoteDecks();
      clearStudySessions();
    },
  };
}
