import { getFirestore, onSnapshot, where, collection, query, orderBy } from "firebase/firestore";

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
    // if physical- deleted, no callback is triggered
    // where("deletedAt", "==", null),
  );
  return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
    const metadata = { size: snapshot.docChanges().length, fromLocal: snapshot.metadata.hasPendingWrites };
    const e = { added: [], modified: [], removed: [], metadata } as DeckEvent;
    snapshot.docChanges().forEach((change) => {
      const id = change.doc.id;
      const deck = { ...change.doc.data(), id } as Deck;
      if (deck.deletedAt != null) {
        e.removed.push(id);
      } else if (change.type === "added") {
        e.added.push(deck);
      } else if (change.type === "modified") {
        e.modified.push(deck);
      } else if (change.type === "removed") {
        e.removed.push(id);
      }
    });
    if (e.added.length > 0 || e.modified.length > 0 || e.removed.length > 0) {
      props.onCange?.(e);
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
  const q = query(
    collection(db, "card"),
    where("uid", "==", props.uid),
    where("updatedAt", ">=", props.updatedAt)
    // offline device can not recieve deleted card events
    // where("deletedAt", "==", null)
  );
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
    });
    if (e.added.length > 0 || e.modified.length > 0 || e.removed.length > 0) {
      props.onCange?.(e);
    }
  });
};
