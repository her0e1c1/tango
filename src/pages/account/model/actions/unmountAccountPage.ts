import { accountPageStore } from "../store";

export function unmountAccountPage(ownerId: symbol): void {
  // Delayed cleanup must never unregister a newer page owner.
  if (accountPageStore.getState().ownerId !== ownerId) return;
  accountPageStore.setState(accountPageStore.getInitialState());
}
