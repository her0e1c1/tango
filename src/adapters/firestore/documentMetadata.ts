/**
 * @file Implements the Firestore adapter responsibility for Document Metadata.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { doc, collection } from "firebase/firestore";
import { getDb } from "@/shared/firestore";

/**
 * Asks Firestore to generate a unique identifier for a new deck.
 * Only the identifier is returned; the deck document is written later by the deck adapter.
 */
export const generateDeckId = (): string => doc(collection(getDb(), "deck")).id;
