/**
 * @file Implements the Firestore adapter responsibility for Document Metadata.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { doc, collection } from "firebase/firestore";
import { getDb } from "@/adapters/firestore/runtime";

/**
 * Asks Firestore to generate a unique identifier for a new deck.
 * Only the identifier is returned; the deck document is written later by the deck adapter.
 */
export const generateDeckId = (): string => doc(collection(getDb(), "deck")).id;

/**
 * Asks Firestore to generate a unique identifier for a new card.
 * Only the identifier is returned; the card document is written later by the card adapter.
 */
export const generateCardId = (): string => doc(collection(getDb(), "card")).id;

/**
 * Returns the current time as a numeric timestamp.
 * Using one adapter helper keeps Firestore document timestamps consistent and easy to replace in
 * tests.
 */
export const getTimestamp = () => Date.now();
