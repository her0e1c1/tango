import { generateId } from "@/shared/lib/generateId";
import { deckCreateSchema, deckEditSchema, deckSchema } from "../model/schema";
import { deckStore, replaceLocalDecks } from "../model/store";
import type { Deck, DeckCreateInput, DeckEdit } from "../model/types";

export const generateDeckId = generateId;

export const createLocalDeck = async (input: DeckCreateInput): Promise<void> => {
  const now = Date.now();
  const deck = deckSchema.parse({ ...deckCreateSchema.parse(input), localMode: true, createdAt: now, updatedAt: now });
  replaceLocalDecks([...deckStore.getState().localDecks.filter((candidate) => candidate.id !== deck.id), deck]);
};

export const editLocalDeck = async (input: DeckEdit): Promise<void> => {
  const edit = deckEditSchema.parse(input);
  const current = deckStore.getState().localDecks.find((deck) => deck.id === edit.id);
  if (current == null) throw new Error("Local Deck not found");
  const deck = deckSchema.parse({ ...current, ...edit, localMode: true, updatedAt: Date.now() });
  replaceLocalDecks(deckStore.getState().localDecks.map((candidate) => (candidate.id === deck.id ? deck : candidate)));
};

export const deleteLocalDeck = async (deck: Pick<Deck, "id">): Promise<void> => {
  replaceLocalDecks(deckStore.getState().localDecks.filter((candidate) => candidate.id !== deck.id));
};
