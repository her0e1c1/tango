import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

initializeApp({
  projectId: "test",
});

const db = getFirestore();
connectFirestoreEmulator(db, import.meta.env.VITE_DB_HOST, parseInt(import.meta.env.VITE_DB_PORT), {
  mockUserToken: { user_id: "uid" },
});
