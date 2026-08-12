/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { collection, query, where, type DocumentData } from "firebase/firestore";

import { mapCardDocument, mapDeckDocument } from "@/adapters/firestore/dto";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb } from "@/shared/firebase/firestore-runtime";
import { subscribeReads } from "@/shared/firebase/subscribeReads";

type RemoteEntity = { id: string; deletedAt: number | null };

/**
 * Keeps entity-specific query and active-policy knowledge in the compatibility facade while Shared
 * owns the listener lifecycle.
 */
const subscribeEntityReads = <T extends RemoteEntity>(
  collectionName: "deck" | "card",
  props: RemoteSubscriptionProps<T>,
  mapDocument: (id: string, data: DocumentData) => T
): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), collectionName), where("uid", "==", props.uid)),
    mapDocument,
    isActive: (item) => item.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });

/**
 * Subscribes to active deck documents for one user.
 * Deck-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): (() => void) =>
  subscribeEntityReads("deck", props, mapDeckDocument);

/**
 * Subscribes to active card documents for one user.
 * Card-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeEntityReads("card", props, mapCardDocument);
