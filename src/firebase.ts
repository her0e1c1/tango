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
    const db = initializedDb;
    void verifyFirestorePersistence(db)
      .then(() => {
        initializeFirestoreRuntime(db);
      })
      .catch(async (error) => {
        try {
          await terminate(db);
        } catch {
          // Preserve the persistence failure while terminating best-effort.
        }
        blockFirestoreRuntime(error instanceof Error ? error : new Error(String(error)));
      });
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
