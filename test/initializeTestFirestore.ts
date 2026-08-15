/** Initializes the Firestore emulator before exposing it to adapter integration tests. */

import { initializeApp } from "firebase/app";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";

const app = initializeApp({
  projectId: "test",
});

export const testDb = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
});
connectFirestoreEmulator(testDb, import.meta.env.VITE_DB_HOST, Number.parseInt(import.meta.env.VITE_DB_PORT, 10), {
  mockUserToken: { user_id: "uid" },
});
