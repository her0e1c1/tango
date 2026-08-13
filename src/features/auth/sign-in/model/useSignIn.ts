import { useCallback, useRef, useState } from "react";

export const useSignIn = (signIn: () => Promise<void>) => {
  const inFlight = useRef<Promise<void> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(() => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable across calls.
    if (inFlight.current != null) return inFlight.current;

    setPending(true);
    setError(null);
    const promise = signIn().then(
      () => setPending(false),
      (nextError: unknown) => {
        setPending(false);
        setError(nextError);
        throw nextError;
      }
    );
    inFlight.current = promise;
    const clear = () => {
      if (inFlight.current === promise) inFlight.current = null;
    };
    void promise.then(clear, clear);
    return promise;
  }, [signIn]);

  return { pending, error, signIn: run, retry: run };
};
