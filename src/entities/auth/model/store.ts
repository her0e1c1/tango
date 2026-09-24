import { createStore } from "zustand/vanilla";

import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => ({ status: "initializing" }));
