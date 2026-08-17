import { useState } from "react";

import { useAuthAccount, useAuthUid } from "@/entities/auth";

import { signOutCurrentUser } from "./signOut";

export const useSignOut = () => {
  const account = useAuthAccount();
  const uid = useAuthUid();
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

  return {
    pending,
    error,
    signOut: run,
    isLoggedIn: account != null,
    identity: { uid, displayName: account?.displayName ?? null },
  };
};
