import { useAsyncOperation } from "@/shared/hooks";

export const useSignOut = (signOut?: () => Promise<void>) => {
  const operation = useAsyncOperation(signOut);
  return { pending: operation.pending, error: operation.error, signOut: operation.run, retry: operation.run };
};
