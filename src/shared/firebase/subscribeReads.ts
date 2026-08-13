import type { RemoteChange, RemoteSnapshot } from "@/shared/api";

import { onSnapshot as subscribeToQuery, type DocumentData, type Query } from "firebase/firestore";
import { toRemoteSnapshotMetadata } from "./documentMetadata";

export interface SubscribeReadsOptions<T> {
  query: Query;
  mapDocument: (id: string, data: DocumentData) => T;
  isActive: (item: T) => boolean;
  keyOf: (item: T) => string;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}

export const subscribeReads = <T>({
  query,
  mapDocument,
  isActive,
  keyOf,
  onSnapshot,
  onError,
}: SubscribeReadsOptions<T>): (() => void) => {
  let initial = true;
  return subscribeToQuery(
    query,
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const metadata = toRemoteSnapshotMetadata(snapshot.metadata);
        if (initial) {
          const items = snapshot.docs.map((document) => mapDocument(document.id, document.data())).filter(isActive);
          initial = false;
          onSnapshot({ type: "replace", items, metadata });
          return;
        }

        const event: RemoteChange<T> = { added: [], modified: [], removed: [] };
        for (const change of snapshot.docChanges()) {
          const item = mapDocument(change.doc.id, change.doc.data());
          if (!isActive(item) || change.type === "removed") {
            event.removed.push(keyOf(item));
          } else if (change.type === "added") {
            event.added.push(item);
          } else {
            event.modified.push(item);
          }
        }
        onSnapshot({ type: "change", event, metadata });
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );
};
