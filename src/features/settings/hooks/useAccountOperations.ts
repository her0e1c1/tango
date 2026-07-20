/**
 * @file Provides the settings feature's Use Account Operations React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

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

/**
 * Creates and configures an account operation controller.
 * Optional dependencies or settings let production code and tests reuse the same behavior in
 * different environments.
 */
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

  /**
   * Replaces the controller's current state and notifies every subscriber.
   * Centralizing notification ensures React always observes the same snapshot that the controller
   * stores.
   */
  const setState = (nextState: AccountOperationState) => {
    state = nextState;
    for (const listener of listeners) listener();
  };

  /**
   * Chooses the retry callback carried by an operation error, falling back to the original action.
   * Logout cleanup errors can therefore resume unfinished work instead of always signing out again.
   */
  const getRetryOperation = (error: unknown, operation: () => Promise<void>) => {
    if (typeof error !== "object" || error == null || !("retry" in error) || typeof error.retry !== "function") {
      return operation;
    }
    return error.retry as () => Promise<void>;
  };

  /**
   * Clears account-operation state after its scope is no longer active.
   * Generation counters are advanced so late asynchronous completions cannot update a newer
   * settings screen.
   */
  const reset = () => {
    scopeEpoch += 1;
    inFlight = null;
    failedOperation = null;
    logoutHandoffAvailable = false;
    generation = undefined;
    setState({ kind: null, pending: false, error: null });
  };

  /**
   * Resets the account-operation controller only when no listener or operation still needs its
   * state.
   * This preserves StrictMode handoffs while releasing state after the settings screen is actually
   * left.
   */
  const resetWhenUnused = () => {
    if (listeners.size === 0 && inFlight == null && !logoutHandoffAvailable) reset();
  };

  /**
   * Connects the controller to the generation owned by the currently mounted settings screen.
   * StrictMode and logout handoffs may transfer in-flight work; unrelated generations reset stale
   * state before subscribing.
   */
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

  /**
   * Runs one login, logout, or retry operation while publishing pending and error state.
   * Concurrent callers share the in-flight promise, and late results cannot update a newer screen
   * generation.
   */
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

/**
 * Exposes account-operation status and login, logout, and retry actions to React components.
 * The hook connects the mounted settings generation to the shared controller and subscribes to a
 * stable external-store snapshot.
 */
export const useAccountOperations = ({ generation = "settings", login, logout }: AccountOperationDependencies) => {
  accountOperationController.setDependencies({ login, ...(logout ? { logout } : {}) });
  /**
   * Subscribes the React hook to account-operation state for the current settings generation.
   * The controller handles StrictMode resubscription and notifies React whenever pending or error
   * state changes.
   */
  const subscribe = (listener: () => void) => accountOperationController.subscribe(generation, listener);
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
