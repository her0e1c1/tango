/** Initializes the Firestore emulator before exposing it to adapter integration tests. */

import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const app =
  getApps().length === 0
    ? initializeApp({
        apiKey: "demo-key",
        projectId: "test",
      })
    : getApp();

export const testDb = getFirestore(app);
connectFirestoreEmulator(testDb, import.meta.env.VITE_DB_HOST, Number.parseInt(import.meta.env.VITE_DB_PORT, 10), {
  mockUserToken: { user_id: "uid" },
});
