import { useState } from "react";

export const useSignIn = (signIn: () => Promise<void>) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      await signIn();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, signIn: run };
};
