import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

export interface CurrentUser {
  uid: string;
  isAnonymous: boolean;
  displayName: string | null;
}

const currentUserStore = createStore<CurrentUser | null>()(() => null);

export const setCurrentUser = (user: CurrentUser | null): void => {
  // Replace the snapshot wholesale so metadata from an earlier identity cannot survive an identity change.
  currentUserStore.setState(user, true);
};

export const useCurrentUser = (): CurrentUser | null => useStore(currentUserStore);
