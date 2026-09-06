import type { RefObject } from "react";

export interface AccountActionControls {
  pendingRef: RefObject<boolean>;
  setPending: (pending: boolean) => void;
  isMounted: () => boolean;
}
