/**
 * @file Creates the Firebase services used by authentication and Firestore adapters.
 * Initialization is kept here so the rest of the application can reuse one configured service
 * instance.
 */

import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import {
  getDb,
  getFirestoreInitializationState,
  initializeFirestoreAdapter,
  waitForFirestoreInitialization,
} from "@/adapters/firestore";

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
initializeFirestoreAdapter(app);

export { getDb, getFirestoreInitializationState, waitForFirestoreInitialization };

if (import.meta.env.MODE === "dev") {
  const host = import.meta.env.VITE_AUTH_HOST;
  const port = import.meta.env.VITE_AUTH_PORT;
  connectAuthEmulator(auth, `http://${host}:${port}`);
}
