import { useCallback, useEffect, useRef, useState } from "react";

export const useAsyncOperation = (operation?: () => Promise<void>) => {
  const operationRef = useRef(operation);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    operationRef.current = operation;
  }, [operation]);

  const run = useCallback((): Promise<void> => {
    // biome-ignore lint/suspicious/noUnnecessaryConditions: React refs are mutable across calls.
    if (inFlightRef.current != null) return inFlightRef.current;

    const currentOperation = operationRef.current;
    if (currentOperation == null) return Promise.resolve();

    setPending(true);
    setError(null);

    let attempt: Promise<void>;
    try {
      attempt = currentOperation();
    } catch (nextError) {
      attempt = Promise.reject(nextError);
    }

    const promise = attempt.then(
      () => {
        setPending(false);
      },
      (nextError: unknown) => {
        setPending(false);
        setError(nextError);
        throw nextError;
      }
    );
    inFlightRef.current = promise;
    const clearInFlight = () => {
      if (inFlightRef.current === promise) inFlightRef.current = null;
    };
    void promise.then(clearInFlight, clearInFlight);
    return promise;
  }, []);

  return { pending, error, run };
};
