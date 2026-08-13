import type { AuthenticatedSession, AuthSessionState } from "@/entities/auth-session";

type AuthRequest =
  | { status: Exclude<AuthSessionState["status"], "authenticated"> }
  | { status: "authenticated"; identity: AuthenticatedSession };

export type AuthTransitionDependencies = {
  cleanupUid: (uid: string) => unknown | Promise<unknown>;
  subscribeUid: (uid: string) => unknown | Promise<unknown>;
  reportError: (error: unknown) => void;
};

const getRequest = (state: AuthSessionState): AuthRequest =>
  state.status === "authenticated"
    ? {
        status: state.status,
        identity: { uid: state.uid, isAnonymous: state.isAnonymous, displayName: state.displayName },
      }
    : { status: state.status };

const isSameIdentity = (left: AuthenticatedSession, right: AuthenticatedSession) =>
  left.uid === right.uid && left.isAnonymous === right.isAnonymous && left.displayName === right.displayName;

const isSameRequest = (left: AuthRequest | undefined, right: AuthRequest) => {
  if (!left || left.status !== right.status) return false;
  if (left.status !== "authenticated" || right.status !== "authenticated") return true;
  return isSameIdentity(left.identity, right.identity);
};

const processTransition = async (
  request: AuthRequest,
  state: AuthSessionState,
  getGeneration: () => number,
  currentGeneration: number,
  activeIdentity: AuthenticatedSession | undefined,
  dependencies: AuthTransitionDependencies,
  cleanupActiveUid: () => Promise<void>
): Promise<AuthenticatedSession | undefined> => {
  if (state.status !== "authenticated") {
    await cleanupActiveUid();
    return undefined;
  }

  const nextIdentity = request.status === "authenticated" ? request.identity : undefined;
  if (nextIdentity == null) return activeIdentity;

  if (activeIdentity?.uid === nextIdentity.uid) {
    if (currentGeneration === getGeneration()) return nextIdentity;
    return activeIdentity;
  }

  await cleanupActiveUid();
  if (currentGeneration !== getGeneration()) return undefined;

  await dependencies.subscribeUid(nextIdentity.uid);
  return nextIdentity;
};

export const createAuthTransitionController = (dependencies: AuthTransitionDependencies) => {
  let generation = 0;
  let requestedState: AuthRequest | undefined;
  let activeIdentity: AuthenticatedSession | undefined;
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
    transition: (state: AuthSessionState) => {
      const request = getRequest(state);
      if (isSameRequest(requestedState, request)) return tail;
      requestedState = request;
      const currentGeneration = ++generation;

      tail = tail
        .then(async () => {
          activeIdentity = await processTransition(
            request,
            state,
            () => generation,
            currentGeneration,
            activeIdentity,
            dependencies,
            cleanupActiveUid
          );
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
