import { replaceCards, type Card } from "@/entities/card";

import { collection, onSnapshot, query, where } from "firebase/firestore";

import { toRemoteById, type RemoteSubscriptionProps, type RemoteSyncStatus } from "@/shared/api";
import { db } from "@/shared/firebase";
import { convertCardDtoToCard } from "./dto";

const toSyncStatus = (metadata: { fromCache: boolean; hasPendingWrites: boolean }): RemoteSyncStatus => {
  if (metadata.hasPendingWrites) return "pending";
  if (metadata.fromCache) return "cached";
  return "synced";
};

export const subscribeCardReads = (props: RemoteSubscriptionProps<Card>): (() => void) =>
  onSnapshot(
    query(collection(db, "card"), where("uid", "==", props.uid)),
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const cards = snapshot.docs
          .map((document) => convertCardDtoToCard(document.id, document.data()))
          .filter((card) => card.deletedAt === null);
        props.onSnapshot({ itemsById: toRemoteById(cards), syncStatus: toSyncStatus(snapshot.metadata) });
        // Remove this bridge in #773 after the App owns the Card subscription.
        replaceCards(cards);
      } catch (cause) {
        props.onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    props.onError
  );
