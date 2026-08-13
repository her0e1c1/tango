/** Initializes the Firestore emulator before exposing it to adapter integration tests. */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

import { initializeFirestoreRuntime } from "@/shared/firebase/firestore-runtime";

initializeApp({
  projectId: "test",
});

const db = getFirestore();
connectFirestoreEmulator(db, import.meta.env.VITE_DB_HOST, parseInt(import.meta.env.VITE_DB_PORT, 10), {
  mockUserToken: { user_id: "uid" },
});
initializeFirestoreRuntime(db);
