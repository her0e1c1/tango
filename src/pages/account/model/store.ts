import { createStore } from "zustand/vanilla";

export interface AccountPageState {
  signIn: { pending: boolean };
  signOut: { pending: boolean };
}

// Keep each operation locked across Page remounts until its own completion.
export const accountPageStore = createStore<AccountPageState>()(() => ({
  signIn: { pending: false },
  signOut: { pending: false },
}));
