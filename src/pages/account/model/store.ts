import { createStore } from "zustand/vanilla";

import type { AccountPageState } from "./types";

export const accountPageStore = createStore<AccountPageState & { mount: symbol | null }>()(() => ({
  mount: null,
  signIn: { pending: false },
  signOut: { pending: false },
}));
