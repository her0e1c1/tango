import { useCallback, useRef, useState } from "react";

export const useSignOut = (signOut?: () => Promise<void>) => {
  const inFlight = useRef<Promise<void> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(() => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable across calls.
    if (inFlight.current != null) return inFlight.current;
    if (signOut == null) return Promise.resolve();

    setPending(true);
    setError(null);
    const promise = signOut().then(
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
  }, [signOut]);

  return { pending, error, signOut: run, retry: run };
};
