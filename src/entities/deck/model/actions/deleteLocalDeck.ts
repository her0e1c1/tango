import { deckIdSchema } from "../schema";
import type { DeckId } from "../types";
import { deckStore } from "../store";

// Removes one local Deck after validating its identifier.
export const deleteLocalDeck = (input: DeckId): void => {
  const deckId = deckIdSchema.parse(input);
  deckStore.setState({ localDecks: deckStore.getState().localDecks.filter(({ id }) => id !== deckId) });
};
