import { useAuthSession } from "./useAuthSession";

export const useAuth = () => {
  const authSession = useAuthSession();
  const session = authSession.status === "authenticated" ? authSession : undefined;

  return {
    // Treat missing sessions as anonymous for presentation until authentication supplies an identity.
    isAnonymous: session?.isAnonymous ?? true,
    displayName: session?.displayName ?? null,
    uid: session?.uid ?? "",
  };
};
