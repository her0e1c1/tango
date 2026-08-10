import { collection, onSnapshot, query, where } from "firebase/firestore";

import type { RemoteChange, RemoteSubscriptionProps } from "@/shared/lib/remote";

import { getDb } from "../firestore-runtime";

type RemoteEntity = { id: string; updatedAt: number; deletedAt: number | null };

export const subscribeRemoteCollection = <T extends RemoteEntity>(
  collectionName: string,
  props: RemoteSubscriptionProps<T>,
  mapDocument: (id: string, data: Record<string, unknown>) => T
): (() => void) => {
  const q = query(collection(getDb(), collectionName), where("uid", "==", props.uid));
  let initial = true;
  return onSnapshot(
    q,
    { includeMetadataChanges: true },
    (snapshot) => {
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
          if (item.deletedAt !== null || change.type === "removed") event.removed.push(item.id);
          else if (change.type === "added") event.added.push(item);
          else event.modified.push(item);
        }
        props.onSnapshot({ type: "change", event, metadata });
      } catch (cause) {
        props.onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    props.onError
  );
};
