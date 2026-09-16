import { useLayoutEffect } from "react";
import type { StoreApi } from "zustand/vanilla";

// Use once per mounted owner of a transient store; concurrent owners would reset each other's state.
export function useResetStoreOnMount<State>(store: StoreApi<State>): void {
  useLayoutEffect(() => {
    function reset() {
      store.setState(store.getInitialState(), true);
    }

    // Reset before stale UI can paint, and invalidate pending work when its owner leaves.
    reset();
    return reset;
  }, [store]);
}
