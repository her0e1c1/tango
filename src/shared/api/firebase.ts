/**
 * @file Creates the Firebase services used by authentication and Firestore adapters.
 * Initialization is kept here so the rest of the application can reuse one configured service
 * instance.
 */

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore, persistentLocalCache } from "firebase/firestore";

const projectId = import.meta.env.VITE_PROJECT_ID || "demo-project";
const apiKey = import.meta.env.VITE_WEB_API_KEY || "demo-key";

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

const authHost = import.meta.env.VITE_AUTH_HOST;
const authPort = import.meta.env.VITE_AUTH_PORT;
if (import.meta.env.DEV && authHost && authPort) {
  connectAuthEmulator(auth, `http://${authHost}:${authPort}`);
}

const dbHost = import.meta.env.VITE_DB_HOST;
const dbPort = import.meta.env.VITE_DB_PORT;
if (import.meta.env.DEV && dbHost && dbPort) {
  connectFirestoreEmulator(db, dbHost, Number.parseInt(dbPort, 10));
}
