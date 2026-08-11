/** Initializes the shared Firestore instance and verifies production persistence before exposing it. */

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

import { verifyFirestorePersistence } from "./firestorePersistence";
import { blockFirestoreRuntime, initializeFirestoreRuntime } from "./firestore-runtime";

const toError = (value: unknown): Error => (value instanceof Error ? value : new Error(String(value)));

export const initializeFirestoreAdapter = (app: FirebaseApp): Firestore | undefined => {
  let db: Firestore | undefined;

  try {
    const localCache = import.meta.env.PROD
      ? persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
      : memoryLocalCache();
    db = initializeFirestore(app, { localCache });

    if (import.meta.env.DEV) {
      const host = import.meta.env.VITE_DB_HOST;
      const port = import.meta.env.VITE_DB_PORT;
      connectFirestoreEmulator(db, host, parseInt(port, 10));
    }

    if (import.meta.env.PROD) {
      const initializedDb = db;
      void verifyFirestorePersistence(initializedDb).then(
        () => {
          initializeFirestoreRuntime(initializedDb);
        },
        async (error) => {
          try {
            await terminate(initializedDb);
          } catch {
            // Preserve the persistence failure while terminating best-effort.
          }
          blockFirestoreRuntime(toError(error));
        }
      );
    } else {
      initializeFirestoreRuntime(db);
    }
  } catch (error) {
    blockFirestoreRuntime(toError(error));
  }

  return db;
};
