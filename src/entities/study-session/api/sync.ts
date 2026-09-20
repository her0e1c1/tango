import { receiveStudySessions } from "../model/actions/receiveStudySessions";
import { setStudySessionOwner } from "../model/actions/setStudySessionOwner";
import { setStudySessionSyncStatus } from "../model/actions/setStudySessionSyncStatus";
import { subscribeStudySessions } from "./firestore";

export function syncStudySessions(uid: string, onError: (error: Error) => void): () => void {
  setStudySessionOwner(uid);
  let stopped = false;
  const stopRemote = subscribeStudySessions(
    uid,
    (sessions) => {
      if (stopped) return;
      receiveStudySessions(uid, sessions);
      setStudySessionSyncStatus("ready");
    },
    (error) => {
      if (stopped) return;
      setStudySessionSyncStatus("error");
      onError(error);
    }
  );
  return () => {
    stopped = true;
    stopRemote();
  };
}
