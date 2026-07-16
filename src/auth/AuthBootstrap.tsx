import type { User } from "firebase/auth";
import { useEffect, useRef } from "react";

import { useAuth, type AuthState } from "@/auth/AuthContext";
import { cleanupFirestoreUid } from "@/query/cleanup";
import { startRemoteReads } from "@/query/remoteReadSession";

type AuthenticatedIdentity = {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
};

type AuthRequest =
  | { status: Exclude<AuthState["status"], "authenticated"> }
  | { status: "authenticated"; identity: AuthenticatedIdentity };

export type AuthTransitionDependencies = {
  cleanupUid: (uid: string) => unknown | Promise<unknown>;
  subscribeUid: (uid: string) => unknown | Promise<unknown>;
  reportError: (error: unknown) => void;
};

const getIdentity = (user: User): AuthenticatedIdentity => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

const isSameIdentity = (left: AuthenticatedIdentity, right: AuthenticatedIdentity) =>
  left.uid === right.uid && left.isAnonymous === right.isAnonymous && left.displayName === right.displayName;

const getRequest = (state: AuthState): AuthRequest =>
  state.status === "authenticated"
    ? { status: state.status, identity: getIdentity(state.user) }
    : { status: state.status };

const isSameRequest = (left: AuthRequest | undefined, right: AuthRequest) => {
  if (!left || left.status !== right.status) return false;
  if (left.status !== "authenticated" || right.status !== "authenticated") return true;
  return isSameIdentity(left.identity, right.identity);
};

// biome-ignore lint/style/useComponentExportOnlyModules: The pure controller keeps auth transitions deterministic.
export const createAuthTransitionController = (dependencies: AuthTransitionDependencies) => {
  let generation = 0;
  let requestedState: AuthRequest | undefined;
  let activeIdentity: AuthenticatedIdentity | undefined;
  let tail = Promise.resolve(true);

  const reportError = (error: unknown) => {
    try {
      dependencies.reportError(error);
    } catch {
      // Reporting must not break the serialized transition queue.
    }
  };

  const cleanupActiveUid = async () => {
    const identity = activeIdentity;
    if (!identity) return;
    await dependencies.cleanupUid(identity.uid);
    if (activeIdentity === identity) activeIdentity = undefined;
  };

  return {
    transition: (state: AuthState) => {
      const request = getRequest(state);
      if (isSameRequest(requestedState, request)) return tail;
      requestedState = request;
      const currentGeneration = ++generation;

      tail = tail
        .then(async () => {
          if (state.status !== "authenticated") {
            await cleanupActiveUid();
            return true;
          }

          const nextIdentity = getIdentity(state.user);
          if (activeIdentity?.uid === nextIdentity.uid) {
            if (currentGeneration === generation) activeIdentity = nextIdentity;
            return true;
          }

          await cleanupActiveUid();
          if (currentGeneration !== generation) return true;

          await dependencies.subscribeUid(nextIdentity.uid);
          activeIdentity = nextIdentity;
          return true;
        })
        .catch((error) => {
          reportError(error);
          if (currentGeneration === generation && requestedState && isSameRequest(requestedState, request)) {
            requestedState = undefined;
          }
          return false;
        });

      return tail;
    },
  };
};

export const AuthBootstrap = () => {
  const authState = useAuth();
  const controllerRef = useRef<ReturnType<typeof createAuthTransitionController>>();
  const retryRef = useRef<{ request: AuthRequest; attempted: boolean }>();
  const nextRequest = getRequest(authState);

  if (!retryRef.current || !isSameRequest(retryRef.current.request, nextRequest)) {
    retryRef.current = { request: nextRequest, attempted: false };
  }
  const request = retryRef.current.request;

  if (!controllerRef.current) {
    controllerRef.current = createAuthTransitionController({
      cleanupUid: cleanupFirestoreUid,
      subscribeUid: startRemoteReads,
      reportError: (error) => console.error("Auth transition failed", error),
    });
  }

  useEffect(() => {
    let cancelled = false;
    const transition = async () => {
      const succeeded = await controllerRef.current?.transition(authState);
      const retry = retryRef.current;
      if (!cancelled && succeeded === false && retry && !retry.attempted && isSameRequest(retry.request, request)) {
        retry.attempted = true;
        await controllerRef.current?.transition(authState);
      }
    };
    void transition();
    return () => {
      cancelled = true;
    };
  }, [authState, request]);

  return null;
};
