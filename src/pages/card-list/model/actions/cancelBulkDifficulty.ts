import type { ListMutationControl } from "../types";
import { dismissListError } from "./dismissListError";

export const cancelBulkDifficulty = (mutation: ListMutationControl, setRequest: (request: undefined) => void): void => {
  if (mutation.pendingRef.current) return;
  dismissListError(mutation.errorToastId);
  setRequest(undefined);
};
