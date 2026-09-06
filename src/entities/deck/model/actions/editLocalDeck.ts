import type { z } from "zod";

import { omitUndefined } from "@/shared/lib/omitUndefined";
import { deckEditSchema, localDeckSchema } from "../schema";
import type { Deck } from "../types";
import { deckStore } from "../store";

// Applies a validated partial edit to an existing local Deck.
export const editLocalDeck = (input: z.input<typeof deckEditSchema>): Extract<Deck, { localMode: true }> => {
  const edit = deckEditSchema.parse(input);
  const { localDecks } = deckStore.getState();
  const currentDeck = localDecks.find(({ id }) => id === edit.id);
  if (currentDeck === undefined) throw new Error(`Local Deck "${edit.id}" was not found`);

  // null is an edit command sentinel; stored Decks represent a missing URL by omitting the field.
  const updatedValues = omitUndefined({
    ...currentDeck,
    ...edit,
    url: edit.url === null ? undefined : (edit.url ?? currentDeck.url),
    updatedAt: Date.now(),
  });
  const updatedDeck = localDeckSchema.parse(updatedValues);
  deckStore.setState({ localDecks: localDecks.map((deck) => (deck.id === updatedDeck.id ? updatedDeck : deck)) });
  return updatedDeck;
};
