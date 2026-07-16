import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { initializeFirestoreRuntime } from "@/firestoreRuntime";

initializeApp({
  projectId: "test",
});

const db = getFirestore();
initializeFirestoreRuntime(db);
connectFirestoreEmulator(db, import.meta.env.VITE_DB_HOST, parseInt(import.meta.env.VITE_DB_PORT, 10), {
  mockUserToken: { user_id: "uid" },
});
