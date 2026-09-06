import type { Deck } from "../types";
import { deckStore } from "../store";

// Replaces the remote Deck snapshot published by the active subscription.
export const replaceRemoteDecks = (remoteDecks: Extract<Deck, { localMode: false }>[]): void => {
  deckStore.setState({ remoteDecks });
};
