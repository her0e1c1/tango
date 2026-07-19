import { collection, getDocsFromCache, query, type Firestore } from "firebase/firestore";

type InspectableFirestore = Firestore & {
  _firestoreClient?: {
    _offlineComponents?: { kind?: string };
  };
};

type CacheWarmer = (db: Firestore) => Promise<unknown>;

export class FirestorePersistenceUnavailableError extends Error {
  constructor() {
    super("Firestore persistent storage is unavailable. Memory fallback is disabled.");
    this.name = "FirestorePersistenceUnavailableError";
  }
}

const warmLocalCache: CacheWarmer = (db) => getDocsFromCache(query(collection(db, "__persistence_probe__")));

export const verifyFirestorePersistence = async (db: Firestore, warmCache: CacheWarmer = warmLocalCache) => {
  await warmCache(db);
  // Firestore 10.x silently replaces a failed persistent provider with memory.
  // Inspect the initialized provider so the app never exposes that fallback.
  const cacheKind = (db as InspectableFirestore)._firestoreClient?._offlineComponents?.kind;
  if (cacheKind !== "persistent") throw new FirestorePersistenceUnavailableError();
};
