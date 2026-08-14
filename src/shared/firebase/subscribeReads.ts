import { toRemoteById, type RemoteSnapshot, type RemoteSyncStatus } from "@/shared/api";

import { onSnapshot as subscribeToQuery, type DocumentData, type Query } from "firebase/firestore";

export interface SubscribeReadsOptions<T extends { id: string }> {
  query: Query;
  mapDocument: (id: string, data: DocumentData) => T;
  isActive: (item: T) => boolean;
  onSnapshot: (snapshot: RemoteSnapshot<T>) => void;
  onError: (error: Error) => void;
}

const toSyncStatus = (metadata: { fromCache: boolean; hasPendingWrites: boolean }): RemoteSyncStatus => {
  if (metadata.hasPendingWrites) return "pending";
  if (metadata.fromCache) return "cached";
  return "synced";
};

export const subscribeReads = <T extends { id: string }>({
  query,
  mapDocument,
  isActive,
  onSnapshot,
  onError,
}: SubscribeReadsOptions<T>): (() => void) => {
  return subscribeToQuery(
    query,
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        const items = snapshot.docs.map((document) => mapDocument(document.id, document.data())).filter(isActive);
        onSnapshot({ itemsById: toRemoteById(items), syncStatus: toSyncStatus(snapshot.metadata) });
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error(String(cause)));
      }
    },
    onError
  );
};
