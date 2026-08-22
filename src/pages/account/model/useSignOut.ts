import { useState } from "react";

import { signOutCurrentUser } from "./signOut";

export const useSignOut = () => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = async () => {
    setPending(true);
    setError(null);
    try {
      await signOutCurrentUser();
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, signOut: run };
};
