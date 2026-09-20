import { acknowledgeStudySessionWrite } from "../model/actions/acknowledgeStudySessionWrite";
import { receiveStudySessions } from "../model/actions/receiveStudySessions";
import { setStudySessionOwner } from "../model/actions/setStudySessionOwner";
import { setStudySessionSyncStatus } from "../model/actions/setStudySessionSyncStatus";
import { studySessionStore } from "../model/store";
import { saveStudySession, subscribeStudySessions } from "./firestore";

export function syncStudySessions(uid: string, onError: (error: Error) => void): () => void {
  setStudySessionOwner(uid);
  let stopped = false;
  const isActive = (): boolean => !stopped;
  let saving = false;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let retryDelay = 1000;

  async function flush(): Promise<void> {
    if (!isActive() || saving || retry !== undefined) return;
    saving = true;
    try {
      // The durable queue belongs to the session, not a Page visit or this subscription's lifetime.
      while (isActive()) {
        const write = Object.values(studySessionStore.getState().pendingWrites).find(
          (candidate) => candidate.session.remote?.uid === uid
        );
        if (write === undefined) break;
        const saved = await saveStudySession(uid, write);
        if (!isActive()) return;
        acknowledgeStudySessionWrite(write);
        receiveStudySessions(uid, [saved]);
        retryDelay = 1000;
      }
    } catch (error) {
      if (!isActive()) return;
      if (retryDelay === 1000) onError(error instanceof Error ? error : new Error(String(error)));
      retry = setTimeout(() => {
        retry = undefined;
        void flush();
      }, retryDelay);
      retryDelay = Math.min(retryDelay * 2, 60_000);
    } finally {
      saving = false;
    }
  }

  const stopStore = studySessionStore.subscribe((state, previous) => {
    if (state.pendingWrites !== previous.pendingWrites) void flush();
  });
  const stopRemote = subscribeStudySessions(
    uid,
    (writes) => {
      if (stopped) return;
      receiveStudySessions(uid, writes);
      setStudySessionSyncStatus("ready");
    },
    (error) => {
      if (stopped) return;
      setStudySessionSyncStatus("error");
      onError(error);
    }
  );
  void flush();
  return () => {
    stopped = true;
    clearTimeout(retry);
    stopStore();
    stopRemote();
  };
}
