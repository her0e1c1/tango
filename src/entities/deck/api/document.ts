import { parseFirestoreDocument } from "@/shared/api";
import { deckDocumentSchema } from "../model/schema";
import type { DeckDocument, DeckId } from "../model/types";

// Parses one Firestore payload and reports Deck-specific validation context.
export const parseDeckDocument = (id: DeckId, value: unknown): DeckDocument =>
  parseFirestoreDocument(deckDocumentSchema, "deck", id, value);
