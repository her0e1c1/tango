import { createStore } from "zustand/vanilla";

import type { AccountStoreState } from "./types";

// The router displays one Account page at a time; ownership separates successive mounts of that page.
export const accountPageStore = createStore<AccountStoreState>()(() => ({
  ownerId: null,
  pageState: {
    signIn: { pending: false },
    signOut: { pending: false },
  },
}));
