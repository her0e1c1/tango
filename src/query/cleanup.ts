/**
 * @file Provides shared remote-data behavior for Cleanup.
 * Feature hooks use this layer to read and update Firestore data without owning cache or
 * subscription details.
 */

import { stopRemoteReads } from "@/query/reads/remoteReadSession";
import { remoteStore, type RemoteStore } from "@/store/remoteStore";

/**
 * Stops remote reads and clears Store data that belongs to one user.
 * Logout and account switches call this boundary so data from the previous identity cannot remain
 * visible.
 */
export const cleanupFirestoreUid = async (uid: string, store: RemoteStore = remoteStore) => {
  const errors: unknown[] = [];
  try {
    stopRemoteReads(uid);
  } catch (error) {
    errors.push(error);
  }
  try {
    store.clear(uid);
  } catch (error) {
    errors.push(error);
  }
  if (errors.length > 0) {
    throw errors[0];
  }
};
