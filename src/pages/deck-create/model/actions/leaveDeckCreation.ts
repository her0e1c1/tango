import { deckCreatePageStore as store } from "../store";

export function leaveDeckCreation(session: symbol): void {
  if (store.getState().session !== session) return;
  // Invalidate pending completions before another Page can acquire the store.
  store.setState({ session: undefined, pending: false });
}
