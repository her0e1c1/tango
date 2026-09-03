import * as React from "react";

import { registerToastModalFocusTarget } from "./model";

/** Keeps global Toast interaction and focus restoration within an active modal boundary. */
export const useToastModalFocusTarget = <TModal extends HTMLElement, TFallback extends HTMLElement>(
  modalRef: React.RefObject<TModal | null>,
  fallbackRef: React.RefObject<TFallback | null>
) => {
  React.useLayoutEffect(() => {
    const modal = modalRef.current;
    const fallback = fallbackRef.current;
    if (modal === null || fallback === null) return;
    return registerToastModalFocusTarget(modal, fallback);
  }, [modalRef, fallbackRef]);
};
