import * as React from "react";

interface AccountOperationDependencies {
  generation?: string;
  login: () => Promise<void>;
  logout?: () => Promise<void>;
}

type AccountOperationKind = "login" | "logout";

interface AccountOperationState {
  kind: AccountOperationKind | null;
  pending: boolean;
  error: unknown;
}

interface FailedOperation {
  operation: () => Promise<void>;
  maySignOut: boolean;
  handoffAvailable: boolean;
}

interface InFlightOperation {
  promise: Promise<void>;
  handoffAvailable: boolean;
}

const createAccountOperationController = () => {
  let dependencies: AccountOperationDependencies = { login: () => Promise.resolve() };
  let inFlight: InFlightOperation | null = null;
  let failedOperation: FailedOperation | null = null;
  let generation: string | undefined;
  let logoutHandoffAvailable = false;
  let scopeEpoch = 0;
  let subscriptionGeneration = 0;
  let state: AccountOperationState = { kind: null, pending: false, error: null };
  const listeners = new Set<() => void>();

  const setState = (nextState: AccountOperationState) => {
    state = nextState;
    for (const listener of listeners) listener();
  };

  const getRetryOperation = (error: unknown, operation: () => Promise<void>) => {
    if (typeof error !== "object" || error == null || !("retry" in error) || typeof error.retry !== "function") {
      return operation;
    }
    return error.retry as () => Promise<void>;
  };

  const reset = () => {
    scopeEpoch += 1;
    inFlight = null;
    failedOperation = null;
    logoutHandoffAvailable = false;
    generation = undefined;
    setState({ kind: null, pending: false, error: null });
  };

  const resetWhenUnused = () => {
    if (listeners.size === 0 && inFlight == null && !logoutHandoffAvailable) reset();
  };

  const connectGeneration = (nextGeneration: string) => {
    if (generation == null) {
      generation = nextGeneration;
      return;
    }
    if (generation === nextGeneration) return;

    if (inFlight?.handoffAvailable) {
      inFlight.handoffAvailable = false;
      generation = nextGeneration;
      logoutHandoffAvailable = false;
      return;
    }
    if (logoutHandoffAvailable) {
      generation = nextGeneration;
      logoutHandoffAvailable = false;
      return;
    }

    reset();
    generation = nextGeneration;
  };

  const run = (kind: AccountOperationKind, retryOperation?: FailedOperation): Promise<void> => {
    if (inFlight != null) return inFlight.promise;

    const operation = retryOperation?.operation ?? (kind === "login" ? dependencies.login : dependencies.logout);
    if (operation == null) return Promise.resolve();

    failedOperation = null;
    logoutHandoffAvailable = false;
    const operationGeneration = generation;
    const maySignOut = retryOperation?.maySignOut ?? kind === "logout";
    const operationEpoch = scopeEpoch;
    let currentOperation!: InFlightOperation;
    setState({ kind, pending: true, error: null });
    const promise = operation().then(
      () => {
        if (operationEpoch === scopeEpoch) setState({ kind, pending: false, error: null });
      },
      (error: unknown) => {
        if (operationEpoch === scopeEpoch) {
          const retry = getRetryOperation(error, operation);
          const retriesFullOperation = maySignOut && retry === operation;
          failedOperation = {
            operation: retry,
            maySignOut: retriesFullOperation,
            handoffAvailable: retriesFullOperation && currentOperation.handoffAvailable,
          };
          logoutHandoffAvailable =
            maySignOut &&
            retry !== operation &&
            currentOperation.handoffAvailable &&
            operationGeneration === generation;
          setState({ kind, pending: false, error });
        }
        throw error;
      }
    );
    currentOperation = {
      promise,
      handoffAvailable: retryOperation?.handoffAvailable ?? maySignOut,
    };
    inFlight = currentOperation;
    void promise.then(
      () => {
        if (inFlight?.promise === promise) {
          inFlight = null;
          resetWhenUnused();
        }
      },
      () => {
        if (inFlight?.promise === promise) {
          inFlight = null;
          resetWhenUnused();
        }
      }
    );

    return promise;
  };

  return {
    getSnapshot: () => state,
    subscribe: (nextGeneration: string, listener: () => void) => {
      subscriptionGeneration += 1;
      connectGeneration(nextGeneration);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        const cleanupGeneration = ++subscriptionGeneration;
        // StrictMode immediately resubscribes, while leaving Settings does not.
        queueMicrotask(() => {
          if (cleanupGeneration === subscriptionGeneration) resetWhenUnused();
        });
      };
    },
    setDependencies: (nextDependencies: AccountOperationDependencies) => {
      dependencies = nextDependencies;
    },
    login: () => run("login"),
    logout: () => run("logout"),
    retry: () => (failedOperation == null || state.kind == null ? Promise.resolve() : run(state.kind, failedOperation)),
  };
};

const accountOperationController = createAccountOperationController();

export const useAccountOperations = ({ generation = "settings", login, logout }: AccountOperationDependencies) => {
  accountOperationController.setDependencies({ login, ...(logout ? { logout } : {}) });
  const subscribe = React.useCallback(
    (listener: () => void) => accountOperationController.subscribe(generation, listener),
    [generation]
  );
  const state = React.useSyncExternalStore(
    subscribe,
    accountOperationController.getSnapshot,
    accountOperationController.getSnapshot
  );

  return {
    ...state,
    login: accountOperationController.login,
    logout: accountOperationController.logout,
    retry: accountOperationController.retry,
  };
};
