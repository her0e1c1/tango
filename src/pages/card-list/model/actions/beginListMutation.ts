import type { ListMutationControl } from "../types";
import { dismissListError } from "./dismissListError";

export const beginListMutation = (mutation: ListMutationControl): boolean => {
  if (mutation.pendingRef.current) return false;
  dismissListError(mutation.errorToastId);
  mutation.pendingRef.current = true;
  mutation.setPending(true);
  return true;
};
