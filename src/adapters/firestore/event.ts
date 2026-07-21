/**
 * @file Implements the Firestore adapter responsibility for Event.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { onSnapshot, where, collection, query } from "firebase/firestore";

import { mapCardDocument, mapDeckDocument, type CardDocument, type DeckDocument } from "@/adapters/firestore/dto";
import { getDb } from "@/adapters/firestore/runtime";
import type { RemoteChange, RemoteSubscriptionProps } from "@/store/remoteStore";

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
): Callback => {
  const q = query(collection(getDb(), collectionName), where("uid", "==", props.uid));
  let initial = true;
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const changes = snapshot.docChanges();
      const metadata = {
        size: initial ? snapshot.docs.length : changes.length,
        fromCache: snapshot.metadata.fromCache,
        hasPendingWrites: snapshot.metadata.hasPendingWrites,
      };
      if (initial) {
        initial = false;
        const items = snapshot.docs
          .map((document) => mapDocument(document.id, document.data()))
          .filter((item) => item.deletedAt === null);
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
    },
    props.onError
  );
};

/**
 * Subscribes to active deck documents for one user.
 * Deck-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): Callback =>
  subscribeReads("deck", props, (id, data) => mapDeckDocument(id, data as unknown as DeckDocument));

/**
 * Subscribes to active card documents for one user.
 * Card-specific mapping is supplied to the shared Firestore subscription adapter.
 */
export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): Callback =>
  subscribeReads("card", props, (id, data) => mapCardDocument(id, data as unknown as CardDocument));
