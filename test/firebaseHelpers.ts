import {
  firestoreTimestampDateSchema,
  getTimestamp,
  omitUndefined,
  parseFirestoreDocument,
} from "@/shared/firebase/firestoreDocument";
import { toRemoteById } from "@/shared/remote";

export const firebaseHelpers = {
  firestoreTimestampDateSchema,
  getTimestamp,
  omitUndefined,
  parseFirestoreDocument,
  toRemoteById,
};
