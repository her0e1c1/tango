import { useAuthAccount, useAuthUid } from "@/entities/auth";

export const useAccountQuery = () => {
  const account = useAuthAccount();
  const uid = useAuthUid();

  return { isLoggedIn: account != null, displayName: account?.displayName ?? null, uid };
};
