import { deckStore } from "../store";

// Clears all remote Decks when their authentication scope ends.
export const clearRemoteDecks = (): void => {
  deckStore.setState({ remoteDecks: [] });
};
