import { useAsyncOperation } from "@/shared/hooks";

export const useSignIn = (signIn: () => Promise<void>) => {
  const operation = useAsyncOperation(signIn);
  return { pending: operation.pending, error: operation.error, signIn: operation.run, retry: operation.run };
};
