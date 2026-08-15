import { deckEditSchema, deckIdSchema, localDeckCreateSchema, localDeckSchema } from "../model/schema";
import { deckStore, replaceLocalDecks } from "../model/store";
import type { Deck, DeckEdit, DeckId, LocalDeckCreateInput } from "../model/types";

/** @public */
export const createLocalDeck = (input: LocalDeckCreateInput): Deck => {
  const deck = localDeckCreateSchema.parse(input);
  const timestamp = Date.now();
  const createdDeck = localDeckSchema.parse({ ...deck, createdAt: timestamp, updatedAt: timestamp });
  replaceLocalDecks([...deckStore.getState().localDecks.filter(({ id }) => id !== createdDeck.id), createdDeck]);
  return createdDeck;
};

/** @public */
export const editLocalDeck = (input: DeckEdit): Deck => {
  const edit = deckEditSchema.parse(input);
  const decks = deckStore.getState().localDecks;
  const currentDeck = decks.find(({ id }) => id === edit.id);
  if (currentDeck === undefined) throw new Error(`Local Deck "${edit.id}" was not found`);

  const updatedDeck = localDeckSchema.parse({ ...currentDeck, ...edit, updatedAt: Date.now() });
  replaceLocalDecks(decks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)));
  return updatedDeck;
};

/** @public */
export const deleteLocalDeck = (input: DeckId): void => {
  const deckId = deckIdSchema.parse(input);
  replaceLocalDecks(deckStore.getState().localDecks.filter(({ id }) => id !== deckId));
};
