import type { StoreApi } from "zustand/vanilla";

export interface AccountActionState {
  pending: boolean;
}

export interface AccountActionControls {
  store: StoreApi<AccountActionState>;
  isMounted: () => boolean;
}
