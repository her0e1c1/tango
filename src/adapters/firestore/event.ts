/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { onSnapshot, where, collection, query, type QuerySnapshot } from "firebase/firestore";

import { mapCardDocument, mapDeckDocument } from "@/adapters/firestore/dto";
import type { Card } from "@/entities/card/model/card";
import type { Deck } from "@/entities/deck/model/deck";
import type { RemoteChange, RemoteSnapshot, RemoteSubscriptionProps } from "@/shared/api";
import { getDb } from "@/shared/firebase/firestore-runtime";

type RemoteEntity = { id: string; updatedAt: number; deletedAt: number | null };

/**
 * Creates a Firestore listener that converts document changes into Tango remote snapshots.
 * The generic adapter handles initial data, incremental changes, metadata, and listener errors for
 * either entity type.
 */
const createInitialSnapshot = <T extends RemoteEntity>(
  snapshot: QuerySnapshot,
  mapDocument: (id: string, data: Record<string, unknown>) => T
): RemoteSnapshot<T> => {
  const items = snapshot.docs
    .map((document) => mapDocument(document.id, document.data()))
    .filter((item: T) => item.deletedAt === null);
  return {
    type: "replace",
    items,
    metadata: {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
    },
  };
};

const processChanges = <T extends RemoteEntity>(
  snapshot: QuerySnapshot,
  props: RemoteSubscriptionProps<T>,
  mapDocument: (id: string, data: Record<string, unknown>) => T
) => {
  const changes = snapshot.docChanges();
  const event: RemoteChange<T> = { added: [], modified: [], removed: [] };
  for (const change of changes) {
    const item = mapDocument(change.doc.id, change.doc.data());
    if (item.deletedAt !== null || change.type === "removed") {
      event.removed.push(item.id);
    } else if (change.type === "added") {
      event.added.push(item);
    } else {
      event.modified.push(item);
    }
  }
  props.onSnapshot({
    type: "change",
    event,
    metadata: {
      fromCache: snapshot.metadata.fromCache,
      hasPendingWrites: snapshot.metadata.hasPendingWrites,
    },
  });
};

const subscribeReads = <T extends RemoteEntity>(
  collectionName: "deck" | "card",
  props: RemoteSubscriptionProps<T>,
  mapDocument: (id: string, data: Record<string, unknown>) => T
): (() => void) => {
  const q = query(collection(getDb(), collectionName), where("uid", "==", props.uid));
  let initial = true;
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      // Treat each snapshot atomically so one invalid document cannot publish a partial collection.
      try {
        if (initial) {
          const remoteSnapshot = createInitialSnapshot(snapshot, mapDocument);
          initial = false;
          props.onSnapshot(remoteSnapshot);
        } else {
          processChanges(snapshot, props, mapDocument);
        }
      } catch (cause) {
        props.onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    props.onError
  );
};

/**
 * Subscribes to active deck documents for one user.
 * Deck-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): (() => void) =>
  subscribeReads("deck", props, mapDeckDocument);

/**
 * Subscribes to active card documents for one user.
 * Card-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  subscribeReads("card", props, mapCardDocument);
