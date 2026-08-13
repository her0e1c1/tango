import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from "react";

import { startRemoteReads, stopRemoteReads } from "@/app/providers/remote-read/remoteReadLifecycle";
import { useAuthSession } from "@/entities/auth-session";
import { waitForFirestoreInitialization } from "@/shared/firestore";
import { type RemoteReadLifecycle, RemoteReadScopeProvider } from "@/shared/lib/remote-read";

type AuthenticatedSession = Extract<ReturnType<typeof useAuthSession>, { status: "authenticated" }>;
type LifecycleState = Omit<RemoteReadLifecycle, "retry"> & { session: AuthenticatedSession };

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

export const RemoteReadBootstrap = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const session = authSession.status === "authenticated" ? authSession : null;
  const uid = session?.uid ?? null;
  const runIdRef = useRef(0);
  const [lifecycleState, setLifecycleState] = useState<LifecycleState>();

  const initialize = useCallback(async (currentSession: AuthenticatedSession, runId: number) => {
    try {
      const initialization = await waitForFirestoreInitialization();
      if (runId !== runIdRef.current) return;
      if (initialization.status === "blocked") {
        setLifecycleState({ session: currentSession, status: "blocked", error: initialization.error });
        return;
      }
      startRemoteReads(currentSession.uid);
      setLifecycleState({ session: currentSession, status: "ready" });
    } catch (cause) {
      if (runId === runIdRef.current) {
        setLifecycleState({ session: currentSession, status: "error", error: toError(cause) });
      }
    }
  }, []);

  const retry = useCallback(async () => {
    if (session == null) return;
    const runId = ++runIdRef.current;
    setLifecycleState({ session, status: "loading" });
    await initialize(session, runId);
  }, [initialize, session]);

  useEffect(() => {
    if (session == null) return;
    const runId = ++runIdRef.current;
    void initialize(session, runId);
    return () => {
      runIdRef.current += 1;
      stopRemoteReads(session.uid);
    };
  }, [initialize, session]);

  const lifecycle: RemoteReadLifecycle | undefined =
    uid == null
      ? undefined
      : lifecycleState?.session === session
        ? { ...lifecycleState, retry }
        : { status: "loading", retry };

  return (
    <RemoteReadScopeProvider uid={uid} lifecycle={lifecycle}>
      {children}
    </RemoteReadScopeProvider>
  );
};
