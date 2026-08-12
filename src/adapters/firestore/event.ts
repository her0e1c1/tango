/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

export { subscribeCardReads } from "@/entities/card/api/subscribeCardReads";
export { subscribeDeckReads } from "@/entities/deck/api/subscribeDeckReads";
