import { onSnapshot, type DocumentData, type Query } from "firebase/firestore";

interface SyncedQueryOptions<T> {
  request: Query;
  parse: (id: string, data: DocumentData) => T;
  receive: (result: SyncedQueryResult<T>) => void;
  onError: (error: Error) => void;
}

export interface SyncedQueryResult<T> {
  values: T[];
  fromCache: boolean;
}

export function subscribeSyncedQuery<T>(options: SyncedQueryOptions<T>): () => void {
  return onSnapshot(
    options.request,
    { includeMetadataChanges: true },
    (snapshot) => {
      try {
        // The SDK owns cache reconciliation, pending writes, and rollback.
        const values = snapshot.docs.map((document) =>
          options.parse(document.id, document.data({ serverTimestamps: "estimate" }))
        );
        options.receive({ values, fromCache: snapshot.metadata.fromCache });
      } catch (error) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    },
    options.onError
  );
}
