/**
 * @file Creates the Firebase services used by authentication and Firestore adapters.
 * Initialization is kept here so the rest of the application can reuse one configured service
 * instance.
 */

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const projectId = import.meta.env.VITE_PROJECT_ID;
const apiKey = import.meta.env.VITE_WEB_API_KEY;

const app = initializeApp({
  apiKey,
  projectId,
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  storageBucket: `${projectId}.appspot.com`,
});
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache(),
});

// E2E serves a production bundle for parallel-run performance, but its isolated build must still target emulators.
const useFirebaseEmulators = import.meta.env.DEV || import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";
const authHost = import.meta.env.VITE_AUTH_HOST;
const authPort = import.meta.env.VITE_AUTH_PORT;
if (useFirebaseEmulators && authHost && authPort) {
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`);
}

const dbHost = import.meta.env.VITE_DB_HOST;
const dbPort = import.meta.env.VITE_DB_PORT;
if (useFirebaseEmulators && dbHost && dbPort) {
  connectFirestoreEmulator(db, dbHost, Number.parseInt(dbPort, 10));
}
