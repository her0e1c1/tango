import { createStore } from "zustand/vanilla";

import type { AccountPageState } from "./types";

// Keep each operation locked across Page remounts until its own completion.
export const accountPageStore = createStore<AccountPageState>()(() => ({
  signIn: { pending: false },
  signOut: { pending: false },
}));
