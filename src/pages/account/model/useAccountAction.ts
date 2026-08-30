import { useState } from "react";

export const useAccountAction = (action: () => Promise<unknown>) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async (): Promise<void> => {
    setPending(true);
    setError(null);
    try {
      await action();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, run };
};
