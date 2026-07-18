import * as React from "react";

interface AccountOperationDependencies {
  login: () => Promise<void>;
  logout?: () => Promise<void>;
}

type AccountOperationKind = "login" | "logout";

interface AccountOperationState {
  kind: AccountOperationKind | null;
  pending: boolean;
  error: unknown;
}

const createAccountOperationController = () => {
  let dependencies: AccountOperationDependencies = { login: () => Promise.resolve() };
  let inFlight: Promise<void> | null = null;
  let failedOperation: (() => Promise<void>) | null = null;
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

  const run = (kind: AccountOperationKind, retryOperation?: () => Promise<void>): Promise<void> => {
    if (inFlight != null) return inFlight;

    const operation = retryOperation ?? (kind === "login" ? dependencies.login : dependencies.logout);
    if (operation == null) return Promise.resolve();

    failedOperation = null;
    setState({ kind, pending: true, error: null });
    const promise = operation().then(
      () => setState({ kind, pending: false, error: null }),
      (error: unknown) => {
        failedOperation = getRetryOperation(error, operation);
        setState({ kind, pending: false, error });
        throw error;
      }
    );
    inFlight = promise;
    void promise.then(
      () => {
        if (inFlight === promise) inFlight = null;
      },
      () => {
        if (inFlight === promise) inFlight = null;
      }
    );

    return promise;
  };

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
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

export const useAccountOperations = ({ login, logout }: AccountOperationDependencies) => {
  accountOperationController.setDependencies({ login, ...(logout ? { logout } : {}) });
  const state = React.useSyncExternalStore(
    accountOperationController.subscribe,
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
