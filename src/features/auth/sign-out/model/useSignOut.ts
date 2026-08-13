import * as React from "react";

interface SignOutDependencies {
  generation: string;
  signOut?: () => Promise<void>;
}

interface SignOutState {
  pending: boolean;
  error: unknown;
}

interface FailedOperation {
  operation: () => Promise<void>;
  signsOut: boolean;
  handoffAvailable: boolean;
}

interface InFlightOperation {
  promise: Promise<void>;
  handoffAvailable: boolean;
}

const retryFromError = (error: unknown, operation: () => Promise<void>) => {
  if (typeof error !== "object" || error == null || !("retry" in error) || typeof error.retry !== "function") {
    return operation;
  }
  return error.retry as () => Promise<void>;
};

const createSignOutController = () => {
  let operation: (() => Promise<void>) | undefined;
  let inFlight: InFlightOperation | null = null;
  let failedOperation: FailedOperation | null = null;
  let generation: string | undefined;
  let cleanupHandoffAvailable = false;
  let scopeEpoch = 0;
  let subscriptionGeneration = 0;
  let state: SignOutState = { pending: false, error: null };
  const listeners = new Set<() => void>();

  const setState = (nextState: SignOutState) => {
    state = nextState;
    for (const listener of listeners) listener();
  };

  const reset = () => {
    scopeEpoch += 1;
    inFlight = null;
    failedOperation = null;
    cleanupHandoffAvailable = false;
    generation = undefined;
    setState({ pending: false, error: null });
  };

  const resetWhenUnused = () => {
    if (listeners.size === 0 && inFlight == null && !cleanupHandoffAvailable) reset();
  };

  const connectGeneration = (nextGeneration: string) => {
    if (generation == null) {
      generation = nextGeneration;
      return;
    }
    if (generation === nextGeneration) return;

    // Signing out remounts the settings route with an anonymous identity before cleanup settles.
    if (inFlight?.handoffAvailable) {
      inFlight.handoffAvailable = false;
      generation = nextGeneration;
      cleanupHandoffAvailable = false;
      return;
    }
    if (cleanupHandoffAvailable) {
      generation = nextGeneration;
      cleanupHandoffAvailable = false;
      return;
    }

    reset();
    generation = nextGeneration;
  };

  const run = (nextOperation: () => Promise<void>, signsOut: boolean, handoffAvailable: boolean): Promise<void> => {
    if (inFlight != null) return inFlight.promise;

    failedOperation = null;
    cleanupHandoffAvailable = false;
    const operationGeneration = generation;
    const operationEpoch = scopeEpoch;
    let currentOperation!: InFlightOperation;
    setState({ pending: true, error: null });
    const promise = nextOperation().then(
      () => {
        if (operationEpoch === scopeEpoch) setState({ pending: false, error: null });
      },
      (error: unknown) => {
        if (operationEpoch === scopeEpoch) {
          const retry = retryFromError(error, nextOperation);
          const retriesSignOut = signsOut && retry === nextOperation;
          failedOperation = {
            operation: retry,
            signsOut: retriesSignOut,
            handoffAvailable: retriesSignOut && currentOperation.handoffAvailable,
          };
          cleanupHandoffAvailable =
            signsOut &&
            retry !== nextOperation &&
            currentOperation.handoffAvailable &&
            operationGeneration === generation;
          setState({ pending: false, error });
        }
        throw error;
      }
    );
    currentOperation = { promise, handoffAvailable };
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
        // A StrictMode subscription is replaced in the same task; leaving the screen is not.
        queueMicrotask(() => {
          if (cleanupGeneration === subscriptionGeneration) resetWhenUnused();
        });
      };
    },
    setOperation: (nextOperation: (() => Promise<void>) | undefined) => {
      operation = nextOperation;
    },
    signOut: () => (operation == null ? Promise.resolve() : run(operation, true, true)),
    retry: () =>
      failedOperation == null
        ? Promise.resolve()
        : run(failedOperation.operation, failedOperation.signsOut, failedOperation.handoffAvailable),
  };
};

const signOutController = createSignOutController();

export const useSignOut = ({ generation, signOut }: SignOutDependencies) => {
  signOutController.setOperation(signOut);
  const subscribe = (listener: () => void) => signOutController.subscribe(generation, listener);
  const state = React.useSyncExternalStore(subscribe, signOutController.getSnapshot, signOutController.getSnapshot);

  return { ...state, signOut: signOutController.signOut, retry: signOutController.retry };
};
