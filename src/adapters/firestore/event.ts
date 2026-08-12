/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { collection, query, where } from "firebase/firestore";

import { mapDeckDocument } from "@/adapters/firestore/dto";
import type { Deck } from "@/entities/deck";
import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb, subscribeReads } from "@/shared/firestore";

export { subscribeCardReads } from "@/entities/card/api/subscribeCardReads";

/**
 * Subscribes to active deck documents for one user.
 * Deck-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), "deck"), where("uid", "==", props.uid)),
    mapDocument: mapDeckDocument,
    isActive: (deck) => deck.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
