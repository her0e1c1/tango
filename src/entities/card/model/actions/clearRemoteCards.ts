import { cardStore } from "../store";

// Clears all remote Cards when their authentication scope ends.
export const clearRemoteCards = (): void => {
  cardStore.setState({ remoteCards: [] });
};
