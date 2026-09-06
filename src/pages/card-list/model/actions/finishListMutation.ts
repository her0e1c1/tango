import type { ListMutationControl } from "../types";

export const finishListMutation = (mutation: ListMutationControl): void => {
  mutation.pendingRef.current = false;
  if (mutation.isMounted()) mutation.setPending(false);
};
