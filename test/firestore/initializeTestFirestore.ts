/** Initializes the Firestore emulator before exposing it to integration tests. */

import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeFirestoreRuntime } from "@/shared/firebase/firestore-runtime";

const host = import.meta.env.VITE_DB_HOST;
const port = parseInt(import.meta.env.VITE_DB_PORT, 10);
const clearResponse = await fetch(
  `http://${host}:${port}/emulator/v1/projects/test/databases/(default)/documents`,
  { method: "DELETE" }
);
if (!clearResponse.ok) throw new Error(await clearResponse.text());

initializeApp({
  projectId: "test",
});

const db = getFirestore();
connectFirestoreEmulator(db, host, port, {
  mockUserToken: { user_id: "uid" },
});
initializeFirestoreRuntime(db);
