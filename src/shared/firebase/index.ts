/**
 * @file Creates the Firebase services used by authentication and Firestore adapters.
 * Initialization is kept here so the rest of the application can reuse one configured service
 * instance.
 */

import { initializeApp } from "firebase/app";
import { beforeAuthStateChanged, connectAuthEmulator, getAuth } from "firebase/auth";
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

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true") {
  beforeAuthStateChanged(auth, (nextUser) => {
    const failureKey = "tango-e2e-fail-sign-out-once";
    if (nextUser !== null || window.sessionStorage.getItem(failureKey) !== "armed") return;

    window.sessionStorage.setItem(failureKey, "consumed");
    // Sign-out has no emulator request to intercept, so E2E releases this public transition hook after route replacement.
    return new Promise<void>((_resolve, reject) => {
      window.addEventListener(
        "tango-e2e-release-sign-out-failure",
        () => reject(new Error("E2E_AUTH_SIGN_OUT_FAILURE")),
        { once: true }
      );
    });
  });
}

const dbHost = import.meta.env.VITE_DB_HOST;
const dbPort = import.meta.env.VITE_DB_PORT;
if (useFirebaseEmulators && dbHost && dbPort) {
  connectFirestoreEmulator(db, dbHost, Number.parseInt(dbPort, 10));
}
