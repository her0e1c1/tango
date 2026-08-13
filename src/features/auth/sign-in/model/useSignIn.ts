import * as React from "react";

interface SignInDependencies {
  generation: string;
  signIn: () => Promise<void>;
}

interface SignInState {
  pending: boolean;
  error: unknown;
}

const createSignInController = () => {
  let operation = () => Promise.resolve();
  let inFlight: Promise<void> | null = null;
  let retryOperation: (() => Promise<void>) | null = null;
  let generation: string | undefined;
  let scopeEpoch = 0;
  let subscriptionGeneration = 0;
  let state: SignInState = { pending: false, error: null };
  const listeners = new Set<() => void>();

  const setState = (nextState: SignInState) => {
    state = nextState;
    for (const listener of listeners) listener();
  };

  const reset = () => {
    scopeEpoch += 1;
    inFlight = null;
    retryOperation = null;
    generation = undefined;
    setState({ pending: false, error: null });
  };

  const resetWhenUnused = () => {
    if (listeners.size === 0 && inFlight == null) reset();
  };

  const connectGeneration = (nextGeneration: string) => {
    if (generation == null) {
      generation = nextGeneration;
      return;
    }
    if (generation === nextGeneration) return;

    reset();
    generation = nextGeneration;
  };

  const run = (nextOperation: () => Promise<void>): Promise<void> => {
    if (inFlight != null) return inFlight;

    retryOperation = null;
    const operationEpoch = scopeEpoch;
    setState({ pending: true, error: null });
    const promise = nextOperation().then(
      () => {
        if (operationEpoch === scopeEpoch) setState({ pending: false, error: null });
      },
      (error: unknown) => {
        if (operationEpoch === scopeEpoch) {
          retryOperation = nextOperation;
          setState({ pending: false, error });
        }
        throw error;
      }
    );
    inFlight = promise;
    void promise.then(
      () => {
        if (inFlight === promise) {
          inFlight = null;
          resetWhenUnused();
        }
      },
      () => {
        if (inFlight === promise) {
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
    setOperation: (nextOperation: () => Promise<void>) => {
      operation = nextOperation;
    },
    signIn: () => run(operation),
    retry: () => (retryOperation == null ? Promise.resolve() : run(retryOperation)),
  };
};

const signInController = createSignInController();

export const useSignIn = ({ generation, signIn }: SignInDependencies) => {
  signInController.setOperation(signIn);
  const subscribe = (listener: () => void) => signInController.subscribe(generation, listener);
  const state = React.useSyncExternalStore(subscribe, signInController.getSnapshot, signInController.getSnapshot);

  return { ...state, signIn: signInController.signIn, retry: signInController.retry };
};
