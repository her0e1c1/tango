import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentSingleTabManager,
  terminate,
  type Firestore,
} from "firebase/firestore";
import {
  blockFirestoreRuntime,
  getDb,
  getFirestoreInitializationState,
  initializeFirestoreRuntime,
  waitForFirestoreInitialization,
} from "@/firestoreRuntime";
import { verifyFirestorePersistence } from "@/firestorePersistenceProbe";
import {
  FirestoreSingleTabLeaseUnsupportedError,
  startFirestoreSingleTabLease,
  type FirestoreLockManager,
} from "@/firestoreSingleTabLease";

const projectId = import.meta.env.VITE_PROJECT_ID;
const apiKey = import.meta.env.VITE_WEB_API_KEY;

export const app = initializeApp({
  apiKey,
  projectId,
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  storageBucket: `${projectId}.appspot.com`,
});
export const auth = getAuth(app);

let initializedDb: Firestore | undefined;

try {
  const localCache = import.meta.env.PROD
    ? persistentLocalCache({ tabManager: persistentSingleTabManager({}) })
    : memoryLocalCache();
  initializedDb = initializeFirestore(app, { localCache });
  if (import.meta.env.PROD) {
    const locks = typeof navigator === "undefined" ? undefined : navigator.locks;
    if (!locks) {
      blockFirestoreRuntime(new FirestoreSingleTabLeaseUnsupportedError());
    } else {
      const lease = startFirestoreSingleTabLease(locks as unknown as FirestoreLockManager);
      void lease.ready.then(async (state) => {
        if (state.status === "blocked") {
          blockFirestoreRuntime(state.error);
          return;
        }
        try {
          await verifyFirestorePersistence(initializedDb as Firestore);
          initializeFirestoreRuntime(initializedDb as Firestore);
        } catch (error) {
          try {
            await terminate(initializedDb as Firestore);
          } catch {
            // Preserve the persistence failure while releasing both leases best-effort.
          }
          lease.release();
          blockFirestoreRuntime(error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
  } else {
    initializeFirestoreRuntime(initializedDb);
  }
} catch (error) {
  blockFirestoreRuntime(error instanceof Error ? error : new Error(String(error)));
}

export { getDb, getFirestoreInitializationState, waitForFirestoreInitialization };

if (import.meta.env.MODE === "dev") {
  const host = import.meta.env.VITE_AUTH_HOST;
  const port = import.meta.env.VITE_AUTH_PORT;
  connectAuthEmulator(auth, `http://${host}:${port}`);
}

if (import.meta.env.DEV && initializedDb) {
  const host = import.meta.env.VITE_DB_HOST;
  const port = import.meta.env.VITE_DB_PORT;
  connectFirestoreEmulator(initializedDb, host, parseInt(port, 10));
}
