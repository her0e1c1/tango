import { useState } from "react";

import { loginGoogle } from "./signIn";

export const useSignIn = () => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      await loginGoogle();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, signIn: run };
};
