import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

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

if (import.meta.env.MODE === "dev") {
  const host = import.meta.env.VITE_AUTH_HOST;
  const port = import.meta.env.VITE_AUTH_PORT;
  connectAuthEmulator(auth, `http://${host}:${port}`);
}

if (import.meta.env.DEV) {
  const db = getFirestore(app);
  const host = import.meta.env.VITE_DB_HOST;
  const port = import.meta.env.VITE_DB_PORT;
  connectFirestoreEmulator(db, host, parseInt(port, 10));
}
