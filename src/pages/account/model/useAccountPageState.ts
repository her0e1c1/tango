import { useLayoutEffect } from "react";
import { useStore } from "zustand";

import { accountPageStore } from "./store";

export const useAccountPageState = () => {
  const pageState = useStore(accountPageStore);

  useLayoutEffect(() => {
    // Register ownership before interaction; old completions must not affect a later visit.
    const mount = Symbol("account-page-mount");
    accountPageStore.setState({ mount, signIn: { pending: false }, signOut: { pending: false } });
    return () => {
      if (accountPageStore.getState().mount === mount) {
        accountPageStore.setState({ mount: null, signIn: { pending: false }, signOut: { pending: false } });
      }
    };
  }, []);

  return pageState;
};
