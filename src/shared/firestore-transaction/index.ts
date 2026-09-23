import { runTransaction, type Transaction } from "firebase/firestore";

import { db } from "../firebase";

/** Commits related writes together; a rejection never leaves a partial update. */
export function transact<T>(operation: (transaction: Transaction) => Promise<T>): Promise<T> {
  return runTransaction(db, operation);
}
