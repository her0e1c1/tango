/**
 * @file Coordinates the Auth Bootstrap part of application authentication.
 * It turns Firebase authentication events into stable state that React components can safely
 * consume.
 */

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";

import { useAuth, type AuthState } from "@/auth/AuthContext";
import { cleanupFirestoreUid } from "@/query/cleanup";
import { startRemoteReads } from "@/query/reads/remoteReadSession";

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

/**
 * Returns identity from the authentication flow.
 * Callers receive the needed value without repeating extraction, lookup, or fallback rules.
 */
const getIdentity = (user: User): AuthenticatedIdentity => ({
  uid: user.uid,
  isAnonymous: user.isAnonymous,
  displayName: user.providerData[0]?.displayName ?? null,
});

/**
 * Checks whether the supplied value satisfies the same identity condition.
 * A named predicate makes the decision rule reusable and easier to recognize at each call site.
 */
const isSameIdentity = (left: AuthenticatedIdentity, right: AuthenticatedIdentity) =>
  left.uid === right.uid && left.isAnonymous === right.isAnonymous && left.displayName === right.displayName;

/**
 * Returns request from the authentication flow.
 * Callers receive the needed value without repeating extraction, lookup, or fallback rules.
 */
const getRequest = (state: AuthState): AuthRequest =>
  state.status === "authenticated"
    ? { status: state.status, identity: getIdentity(state.user) }
    : { status: state.status };

/**
 * Checks whether the supplied value satisfies the same request condition.
 * A named predicate makes the decision rule reusable and easier to recognize at each call site.
 */
const isSameRequest = (left: AuthRequest | undefined, right: AuthRequest) => {
  if (!left || left.status !== right.status) return false;
  if (left.status !== "authenticated" || right.status !== "authenticated") return true;
  return isSameIdentity(left.identity, right.identity);
};

/**
 * Creates and configures an auth transition controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
export const createAuthTransitionController = (dependencies: AuthTransitionDependencies) => {
  let generation = 0;
  let requestedState: AuthRequest | undefined;
  let activeIdentity: AuthenticatedIdentity | undefined;
  let tail = Promise.resolve(true);

  /**
   * Reports an authentication transition error without allowing the reporter itself to break the
   * queue.
   * Logging failures are intentionally swallowed because user and subscription cleanup must
   * continue to run.
   */
  const reportError = (error: unknown) => {
    try {
      dependencies.reportError(error);
    } catch {
      // Reporting must not break the serialized transition queue.
    }
  };

  /**
   * Cleans remote subscriptions and cached data for the identity that was previously active.
   * The identity is cleared only if no newer transition replaced it while asynchronous cleanup
   * was running.
   */
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

/**
 * Keeps remote subscriptions aligned with the current Firebase user.
 * The component renders no UI; it serializes authentication transitions and retries a failed
 * transition once.
 */
export const AuthBootstrap = () => {
  const authState = useAuth();
  const [controller] = useState(() =>
    createAuthTransitionController({
      cleanupUid: cleanupFirestoreUid,
      subscribeUid: startRemoteReads,
      reportError: (error) => console.error("Auth transition failed", error),
    })
  );

  useEffect(() => {
    let cancelled = false;
    /**
     * Applies the latest authentication state to the serialized transition controller.
     * A failed transition is retried once unless the component has already unmounted or moved to
     * another state.
     */
    const transition = async () => {
      const succeeded = await controller.transition(authState);
      if (!cancelled && succeeded === false) {
        await controller.transition(authState);
      }
    };
    void transition();
    return () => {
      cancelled = true;
    };
  }, [authState, controller]);

  return null;
};
