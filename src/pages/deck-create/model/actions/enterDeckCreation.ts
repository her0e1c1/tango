import { deckCreatePageStore as store } from "../store";
import { dismissSaveError } from "./dismissSaveError";

export function enterDeckCreation(): symbol {
  dismissSaveError();
  // Each effect setup owns a fresh session, including Strict Mode re-entry.
  const session = Symbol();
  store.setState({ session, pending: false });
  return session;
}
