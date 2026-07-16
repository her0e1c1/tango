import { getFirestore, onSnapshot, where, collection, query, orderBy } from "firebase/firestore";

import { mapCardDocument, mapDeckDocument, type CardDocument, type DeckDocument } from "@/action/firestore/dto";

export interface RemoteSnapshotMetadata {
  size: number;
  fromLocal: boolean;
}

export interface RemoteChange<T> {
  added: T[];
  modified: T[];
  removed: string[];
  lastUpdatedAt?: number;
}

export type RemoteSnapshot<T> =
  | { type: "replace"; items: T[]; metadata: RemoteSnapshotMetadata }
  | { type: "change"; event: RemoteChange<T>; metadata: RemoteSnapshotMetadata };

interface RemoteReadProps<T> {
  uid: string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}

type RemoteEntity = { id: string; updatedAt: number; deletedAt: number | null };

const subscribeReads = <T extends RemoteEntity>(
  collectionName: "deck" | "card",
  props: RemoteReadProps<T>,
  mapDocument: (id: string, data: Record<string, unknown>) => T
): Callback => {
  const q = query(collection(getFirestore(), collectionName), where("uid", "==", props.uid));
  let initial = true;
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
      const changes = snapshot.docChanges();
      const metadata = {
        size: initial ? snapshot.docs.length : changes.length,
        fromLocal: snapshot.metadata.hasPendingWrites,
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
        event.lastUpdatedAt = Math.max(event.lastUpdatedAt ?? item.updatedAt, item.updatedAt);
      }
      if (event.added.length > 0 || event.modified.length > 0 || event.removed.length > 0) {
        props.onSnapshot({ type: "change", event, metadata });
      }
    },
    props.onError
  );
};

export const subscribeDeckReads = (props: RemoteReadProps<Deck>): Callback =>
  subscribeReads("deck", props, (id, data) => mapDeckDocument(id, data as unknown as DeckDocument));

export const subscribeCardReads = (props: RemoteReadProps<Card>): Callback =>
  subscribeReads("card", props, (id, data) => mapCardDocument(id, data as unknown as CardDocument));

interface DeckProps {
  uid: string;
  updatedAt: number;
  onCange: (event: DeckEvent) => void;
}

export const subscribeDeck = (props: DeckProps): Callback => {
  const db = getFirestore();
  const q = query(
    collection(db, "deck"),
    where("uid", "==", props.uid),
    where("updatedAt", ">=", props.updatedAt),
    orderBy("updatedAt", "desc")
  );
  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    const metadata = { size: snapshot.docChanges().length, fromLocal: snapshot.metadata.hasPendingWrites };
    const e = { added: [], modified: [], removed: [], metadata } as DeckEvent;
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      const deck = mapDeckDocument(id, change.doc.data() as DeckDocument);
      if (deck.deletedAt != null) {
        e.removed.push(id);
      } else if (change.type === "added") {
        e.added.push(deck);
      } else if (change.type === "modified") {
        e.modified.push(deck);
      } else if (change.type === "removed") {
        e.removed.push(id);
      }
      if (e.lastUpdatedAt == null) {
        e.lastUpdatedAt = deck.updatedAt;
      } else {
        e.lastUpdatedAt = Math.max(e.lastUpdatedAt, deck.updatedAt);
      }
    });
    if (e.added.length > 0 || e.modified.length > 0 || e.removed.length > 0) {
      props.onCange(e);
    }
  });
};

interface CardProps {
  uid: string;
  updatedAt: number;
  onCange: (event: CardEvent) => void;
}

export const subscribeCard = (props: CardProps): Callback => {
  const db = getFirestore();
  const q = query(collection(db, "card"), where("uid", "==", props.uid), where("updatedAt", ">=", props.updatedAt));
  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    const metadata = { size: snapshot.docChanges().length, fromLocal: snapshot.metadata.hasPendingWrites };
    const e = { added: [], modified: [], removed: [], metadata } as CardEvent;
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      const card = { ...change.doc.data(), id } as Card;
      if (card.deletedAt != null) {
        e.removed.push(id);
      } else if (change.type === "added") {
        e.added.push(card);
      } else if (change.type === "modified") {
        e.modified.push(card);
      } else if (change.type === "removed") {
        e.removed.push(id);
      }
      if (e.lastUpdatedAt == null) {
        e.lastUpdatedAt = card.updatedAt;
      } else {
        e.lastUpdatedAt = Math.max(e.lastUpdatedAt, card.updatedAt);
      }
    });
    if (e.added.length > 0 || e.modified.length > 0 || e.removed.length > 0) {
      props.onCange(e);
    }
  });
};
