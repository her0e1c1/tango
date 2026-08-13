import * as React from "react";

interface SignInDependencies {
  generation: string;
  signIn: () => Promise<void>;
}

interface SignInState {
  generation: string;
  pending: boolean;
  error: unknown;
}

interface InFlightSignIn {
  generation: string;
  promise: Promise<void>;
}

interface FailedSignIn {
  generation: string;
  operation: () => Promise<void>;
}

export const useSignIn = ({ generation, signIn }: SignInDependencies) => {
  const operationRef = React.useRef(signIn);
  const generationRef = React.useRef(generation);
  const inFlightRef = React.useRef<InFlightSignIn | null>(null);
  const failedRef = React.useRef<FailedSignIn | null>(null);
  const [state, setState] = React.useState<SignInState>({ generation, pending: false, error: null });

  React.useEffect(() => {
    operationRef.current = signIn;
  }, [signIn]);

  React.useEffect(() => {
    generationRef.current = generation;
    inFlightRef.current = null;
    failedRef.current = null;
  }, [generation]);

  const run = React.useCallback((operation: () => Promise<void>): Promise<void> => {
    const operationGeneration = generationRef.current;
    const inFlight = inFlightRef.current;
    if (inFlight?.generation === operationGeneration) return inFlight.promise;

    failedRef.current = null;
    setState({ generation: operationGeneration, pending: true, error: null });

    let attempt: Promise<void>;
    try {
      attempt = operation();
    } catch (error) {
      attempt = Promise.reject(error);
    }

    const promise = attempt.then(
      () => {
        if (generationRef.current === operationGeneration) {
          setState({ generation: operationGeneration, pending: false, error: null });
        }
      },
      (error: unknown) => {
        if (generationRef.current === operationGeneration) {
          failedRef.current = { generation: operationGeneration, operation };
          setState({ generation: operationGeneration, pending: false, error });
        }
        throw error;
      }
    );
    inFlightRef.current = { generation: operationGeneration, promise };
    void promise.then(
      () => {
        if (inFlightRef.current?.promise === promise) inFlightRef.current = null;
      },
      () => {
        if (inFlightRef.current?.promise === promise) inFlightRef.current = null;
      }
    );
    return promise;
  }, []);

  const startSignIn = React.useCallback(() => run(operationRef.current), [run]);
  const retry = React.useCallback(() => {
    const failed = failedRef.current;
    return failed?.generation === generationRef.current ? run(failed.operation) : Promise.resolve();
  }, [run]);
  const visibleState = state.generation === generation ? state : { generation, pending: false, error: null };

  return { pending: visibleState.pending, error: visibleState.error, signIn: startSignIn, retry };
};
