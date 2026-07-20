/**
 * @file Implements the Firestore adapter responsibility for Initialize.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import type { FirebaseApp } from "firebase/app";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
  terminate,
  type Firestore,
} from "firebase/firestore";

import { verifyFirestorePersistence } from "@/adapters/firestore/persistenceProbe";
import { blockFirestoreRuntime, initializeFirestoreRuntime } from "@/adapters/firestore/runtime";

/**
 * Initializes Firestore persistence and connects the database to Tango's runtime adapter.
 * If persistent storage cannot be trusted, the adapter is blocked instead of silently using a
 * different storage mode.
 */
export const initializeFirestoreAdapter = (app: FirebaseApp): Firestore | undefined => {
  let db: Firestore | undefined;

  try {
    const localCache = import.meta.env.PROD
      ? persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
      : memoryLocalCache();
    db = initializeFirestore(app, { localCache });
    if (import.meta.env.PROD) {
      const initializedDb = db;
      void verifyFirestorePersistence(initializedDb)
        .then(() => {
          initializeFirestoreRuntime(initializedDb);
        })
        .catch(async (error) => {
          try {
            await terminate(initializedDb);
          } catch {
            // Preserve the persistence failure while terminating best-effort.
          }
          blockFirestoreRuntime(error instanceof Error ? error : new Error(String(error)));
        });
    } else {
      initializeFirestoreRuntime(db);
    }
  } catch (error) {
    blockFirestoreRuntime(error instanceof Error ? error : new Error(String(error)));
  }

  if (import.meta.env.DEV && db) {
    const host = import.meta.env.VITE_DB_HOST;
    const port = import.meta.env.VITE_DB_PORT;
    connectFirestoreEmulator(db, host, parseInt(port, 10));
  }

  return db;
};
