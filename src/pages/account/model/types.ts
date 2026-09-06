import type { StoreApi } from "zustand/vanilla";

export interface AccountPageState {
  signIn: { pending: boolean };
  signOut: { pending: boolean };
}

export type AccountPageStore = StoreApi<AccountPageState>;
