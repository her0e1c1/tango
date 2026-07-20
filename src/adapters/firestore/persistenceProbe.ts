/**
 * @file Implements the Firestore adapter responsibility for Persistence Probe.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import { collection, getDocsFromCache, query, type Firestore } from "firebase/firestore";

type InspectableFirestore = Firestore & {
  _firestoreClient?: {
    _offlineComponents?: { kind?: string };
  };
};

type CacheWarmer = (db: Firestore) => Promise<unknown>;

/**
 * Represents the firestore persistence unavailable error condition used by the Firestore adapter.
 * The class keeps related error details or behavior together so callers can recognize and handle
 * this specific case.
 */
export class FirestorePersistenceUnavailableError extends Error {
  constructor() {
    super("Firestore persistent storage is unavailable. Memory fallback is disabled.");
    this.name = "FirestorePersistenceUnavailableError";
  }
}

/**
 * Attempts a small cache-only Firestore read after persistence starts.
 * The probe reveals whether Firebase silently replaced persistent storage with an in-memory
 * fallback.
 */
const warmLocalCache: CacheWarmer = (db) => getDocsFromCache(query(collection(db, "__persistence_probe__")));

/**
 * Verifies Firestore persistence before the adapter relies on it.
 * A failed requirement is reported at the boundary instead of allowing partially working state.
 */
export const verifyFirestorePersistence = async (db: Firestore, warmCache: CacheWarmer = warmLocalCache) => {
  await warmCache(db);
  // Firestore 10.x silently replaces a failed persistent provider with memory.
  // Inspect the initialized provider so the app never exposes that fallback.
  const cacheKind = (db as InspectableFirestore)._firestoreClient?._offlineComponents?.kind;
  if (cacheKind !== "persistent") throw new FirestorePersistenceUnavailableError();
};
