import { accountPageStore } from "../store";

export function mountAccountPage(): symbol {
  // A fresh owner prevents completions from an earlier mount from affecting this page, including StrictMode replay.
  const ownerId = Symbol("AccountPage");
  accountPageStore.setState({ ...accountPageStore.getInitialState(), ownerId });
  return ownerId;
}
