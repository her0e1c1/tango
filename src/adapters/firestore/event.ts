/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { onSnapshot, where, collection, query } from "firebase/firestore";

import { mapCardDocument, mapDeckDocument } from "@/adapters/firestore/dto";
import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { getDb } from "@/shared/firebase/firestore-runtime";
import type { RemoteChange, RemoteSubscriptionProps } from "@/domain/remoteSnapshot";

type RemoteEntity = { id: string; updatedAt: number; deletedAt: number | null };

/**
 * Creates a Firestore listener that converts document changes into Tango remote snapshots.
 * The generic adapter handles initial data, incremental changes, metadata, and listener errors for
 * either entity type.
 */
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
        const changes = snapshot.docChanges();
        const metadata = {
          size: initial ? snapshot.docs.length : changes.length,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites,
        };
        if (initial) {
          const items = snapshot.docs
            .map((document) => mapDocument(document.id, document.data()))
            .filter((item) => item.deletedAt === null);
          initial = false;
          props.onSnapshot({ type: "replace", items, metadata });
          return;
        }

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
        props.onSnapshot({ type: "change", event, metadata });
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
