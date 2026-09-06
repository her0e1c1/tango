import { createStore } from "zustand/vanilla";

import type { AccountActionState } from "./types";

export const createAccountActionStore = () => createStore<AccountActionState>()(() => ({ pending: false }));
