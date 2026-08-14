import type { Deck, DeckId } from "@/entities/deck";

import { collection, onSnapshot, query, where } from "firebase/firestore";
import { z } from "zod";

import { replaceDecks } from "@/entities/deck";
import { reconcileStudySessionsWithDecks } from "@/features/study";
import { db, parseFirestoreDocument } from "@/shared/firebase";

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

export const subscribeDecks = (uid: string, onError: (error: Error) => void): (() => void) => {
  let active = true;
  let cancelStudyReconciliation: (() => void) | undefined;
  const unsubscribe = onSnapshot(
    query(collection(db, "deck"), where("uid", "==", uid)),
    (snapshot) => {
      if (!active) return;
      try {
        const decks = snapshot.docs
          .map((document) => convertDeckDtoToDeck(document.id, document.data()))
          .filter((deck) => deck.deletedAt === null);
        replaceDecks(decks);
        cancelStudyReconciliation?.();
        cancelStudyReconciliation = reconcileStudySessionsWithDecks(decks.map((deck) => deck.id));
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    (error) => {
      if (active) onError(error);
    }
  );

  return () => {
    active = false;
    unsubscribe();
    cancelStudyReconciliation?.();
  };
};
