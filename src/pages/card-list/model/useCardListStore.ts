import * as React from "react";
import { dismissListError } from "./actions/dismissListError";
import { createCardListStore } from "./store";

export function useCardListStore() {
  const [store] = React.useState(createCardListStore);
  React.useEffect(() => {
    store.setState({ active: true });
    return () => {
      store.setState({ active: false });
      dismissListError(store);
    };
  }, [store]);
  return store;
}
