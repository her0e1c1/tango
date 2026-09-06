import type { RemoteCard } from "../types";
import { cardStore } from "../store";

// Replaces the remote Card snapshot published by the active subscription.
export const replaceRemoteCards = (remoteCards: RemoteCard[]): void => {
  cardStore.setState({ remoteCards });
};
