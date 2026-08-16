import { useState } from "react";

import { useAuthAccount, useAuthUid } from "@/entities/auth";

export const useSignOut = (signOut: () => Promise<void>) => {
  const account = useAuthAccount();
  const uid = useAuthUid();
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

  return {
    pending,
    error,
    signOut: run,
    isLoggedIn: account != null,
    identity: { uid, displayName: account?.displayName ?? null },
  };
};
