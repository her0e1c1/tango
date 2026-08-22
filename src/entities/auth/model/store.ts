import { createStore } from "zustand/vanilla";

import type { AuthUser } from "./types";

export const authUserStore = createStore<AuthUser | null>()(() => null);

export const getAuthUser = (): AuthUser | null => authUserStore.getState();

export const setAuthUser = (user: AuthUser | null): void => {
  // Replace the snapshot wholesale so metadata from an earlier identity cannot survive an auth transition.
  authUserStore.setState(user, true);
};
