/** Initializes the Firestore emulator before exposing it to adapter integration tests. */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

initializeApp({
  projectId: "test",
});

export const testDb = getFirestore();
connectFirestoreEmulator(testDb, import.meta.env.VITE_DB_HOST, Number.parseInt(import.meta.env.VITE_DB_PORT, 10), {
  mockUserToken: { user_id: "uid" },
});
