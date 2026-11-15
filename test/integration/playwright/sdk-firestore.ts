export {
  Timestamp,
  collection,
  connectFirestoreEmulator,
  doc,
  documentId,
  getDocFromCache,
  getDocsFromCache,
  getFirestore,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "@firebase/firestore";
export type {
  Firestore,
  QueryDocumentSnapshot,
  QuerySnapshot,
  WriteBatch,
} from "@firebase/firestore";

export const disableNetwork: typeof import("@firebase/firestore").disableNetwork = async () => undefined;
export const enableNetwork: typeof import("@firebase/firestore").enableNetwork = async () => undefined;
