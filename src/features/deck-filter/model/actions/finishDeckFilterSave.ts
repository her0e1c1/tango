import type { SetDeckFilterDraft } from "../types";

export const finishDeckFilterSave = (pending: Promise<void>, setState: SetDeckFilterDraft): void => {
  // An earlier save must not clear the pending indicator for a newer edit or route.
  setState((current) => (current.pending === pending ? { ...current, pending: undefined } : current));
};
