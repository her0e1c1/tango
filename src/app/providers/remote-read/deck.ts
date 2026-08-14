import type { Deck, DeckId } from "@/entities/deck";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { z } from "zod";

import { replaceDecks } from "@/entities/deck";
import { db } from "@/shared/firebase";
import { parseFirestoreDocument } from "@/shared/firestore";

const deckDtoSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  url: z.string().optional(),
  isPublic: z.boolean(),
  uid: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  deletedAt: z.number().nullable(),
  scoreMax: z.number().nullable(),
  scoreMin: z.number().nullable(),
  selectedTags: z.array(z.string()),
  tagAndFilter: z.boolean(),
  category: z.string(),
  convertToBr: z.boolean(),
});

const convertDeckDtoToDeck = (id: DeckId, value: unknown): Deck => {
  const dto = parseFirestoreDocument(deckDtoSchema, "deck", id, value);
  const deck: Deck = { ...dto, id };
  if (dto.url === undefined) delete deck.url;
  return deck;
};

export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) =>
  onSnapshot(
    query(collection(db, "deck"), where("uid", "==", uid)),
    (snapshot) => {
      try {
        const decks = snapshot.docs
          .map((document) => convertDeckDtoToDeck(document.id, document.data()))
          .filter((deck) => deck.deletedAt === null);
        replaceDecks(decks);
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );
