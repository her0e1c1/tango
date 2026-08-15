import { useState } from "react";

export const useSignOut = (signOut: () => Promise<void>) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      await signOut();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, signOut: run };
};
