import { createStore } from "zustand/vanilla";

import { initialAuthSession } from "./defaults";
import type { AuthSessionState } from "./types";

export const authSessionStore = createStore<AuthSessionState>()(() => initialAuthSession);
