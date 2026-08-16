import { parseFirestoreDocument } from "@/shared/api";
import { cardDocumentSchema } from "../model/schema";
import type { CardDocument } from "../model/types";

// Parses one Firestore payload and reports Card-specific validation context.
export const parseCardDocument = (id: string, value: unknown): CardDocument =>
  parseFirestoreDocument(cardDocumentSchema, "card", id, value);
