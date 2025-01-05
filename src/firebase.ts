import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import "firebase/auth";
import "firebase/firestore";

const projectId = import.meta.env.VITE_PROJECT_ID;
const apiKey = import.meta.env.VITE_WEB_API_KEY;

const app = initializeApp({
  apiKey,
  projectId,
  authDomain: `${projectId}.firebaseapp.com`,
  databaseURL: `https://${projectId}.firebaseio.com`,
  storageBucket: `${projectId}.appspot.com`,
});

if (import.meta.env.DEV) {
  const db = getFirestore(app);
  const host = import.meta.env.VITE_DB_HOST;
  const port = import.meta.env.VITE_DB_PORT;
  connectFirestoreEmulator(db, host, parseInt(port));
}
