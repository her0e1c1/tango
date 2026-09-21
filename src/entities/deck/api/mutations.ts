import type { z } from "zod";
import type { DeckId, RemoteDeckCreateInput } from "../model/types";
import { abandonStudySession } from "@/entities/study-session/@x/deck";
import { findDeckById } from "../model/queries/findDeckById";
import { authenticatedUidSchema, deckEditSchema } from "../model/schema";
import { createDeck as createDocument, editDeck as editDocument, deleteDeck as deleteDocument } from "./firestore";

function requireOwnedDeck(uid: string, id: DeckId): void {
  authenticatedUidSchema.parse(uid);
  const deck = findDeckById(id);
  if (deck === undefined) throw new Error(`Deck "${id}" was not found`);
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
}

export async function createDeck(uid: string, deck: RemoteDeckCreateInput): Promise<void> {
  await createDocument(uid, deck);
}

export async function editDeck(uid: string, deck: z.input<typeof deckEditSchema>): Promise<void> {
  requireOwnedDeck(uid, deck.id);
  await editDocument(uid, deckEditSchema.parse(deck));
}

export async function deleteDeck(uid: string, id: DeckId): Promise<void> {
  requireOwnedDeck(uid, id);
  await deleteDocument(uid, id);
  await abandonStudySession(id);
}
