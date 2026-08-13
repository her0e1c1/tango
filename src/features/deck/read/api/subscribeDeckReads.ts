import type { Deck } from "@/entities/deck";

import { collection, query, where } from "firebase/firestore";

import type { RemoteSubscriptionProps } from "@/shared/api";
import { getDb, subscribeReads } from "@/shared/firestore";
import { convertDeckDocumentToDeck } from "./firestoreDocument";

export const subscribeDeckReads = (props: RemoteSubscriptionProps<Deck>): (() => void) =>
  subscribeReads({
    query: query(collection(getDb(), "deck"), where("uid", "==", props.uid)),
    mapDocument: convertDeckDocumentToDeck,
    isActive: (deck) => deck.deletedAt === null,
    onSnapshot: props.onSnapshot,
    onError: props.onError,
  });
