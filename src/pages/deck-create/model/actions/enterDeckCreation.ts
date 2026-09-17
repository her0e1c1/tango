import { deckCreatePageStore as store } from "../store";

export function enterDeckCreation(): symbol {
  // Each effect setup owns a fresh session, including Strict Mode re-entry.
  const session = Symbol();
  store.setState({ session, pending: false });
  return session;
}
