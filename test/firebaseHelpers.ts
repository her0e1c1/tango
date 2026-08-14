import {
  firestoreTimestampDateSchema,
  getTimestamp,
  omitUndefined,
  parseFirestoreDocument,
} from "@/shared/firebase/firestoreDocument";
import { toRemoteById } from "@/shared/firebase/remoteSnapshot";

export const firebaseHelpers = {
  firestoreTimestampDateSchema,
  getTimestamp,
  omitUndefined,
  parseFirestoreDocument,
  toRemoteById,
};
