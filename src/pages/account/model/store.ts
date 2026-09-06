import { createStore } from "zustand/vanilla";

import type { AccountPageState } from "./types";

export const createAccountPageStore = () =>
  createStore<AccountPageState>()(() => ({
    signIn: { pending: false },
    signOut: { pending: false },
  }));
